import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/webhooks/github/route';
import { GET } from '../app/api/galaxy/[username]/route';
import { db, users, releases, projects } from '../db';
import { eq } from 'drizzle-orm';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runReleaseTests() {
  console.log('=== Tagged Releases as Celebratory Visual Events Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test User
  console.log('1. Setting up test user in Neon DB...');
  const testGithubId = 99933301;
  await db.delete(users).where(eq(users.githubId, testGithubId));

  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: 'release-voyager',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99933301',
    })
    .returning();

  console.log(`   ✓ Created User: ID = ${testUser.id}, @${testUser.githubUsername}`);

  // 2. Test draft release rejection (Architectural policy: only published releases trigger milestone)
  console.log('\n2. Testing draft release event (should be ignored)...');
  const draftPayload = JSON.stringify({
    action: 'published',
    release: {
      id: 11101,
      tag_name: 'v0.9.0-draft',
      name: 'Draft Release',
      published_at: new Date().toISOString(),
      draft: true,
      prerelease: false,
    },
    repository: {
      name: 'deep-space-probe',
      full_name: 'release-voyager/deep-space-probe',
      html_url: 'https://github.com/release-voyager/deep-space-probe',
      owner: {
        id: testGithubId,
        login: 'release-voyager',
      },
    },
    sender: {
      id: testGithubId,
      login: 'release-voyager',
    },
  });

  const reqDraft = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'release',
      'x-hub-signature-256': createHmacSignature(draftPayload, secret),
    },
    body: draftPayload,
  });

  const resDraft = await POST(reqDraft);
  const jsonDraft = await resDraft.json();
  console.log(`   ✓ Status: ${resDraft.status}`, jsonDraft);
  if (!jsonDraft.message?.includes('Ignoring release event')) {
    throw new Error('Draft release was not properly ignored');
  }

  // 3. Test valid published release event
  console.log('\n3. Sending valid published release event for "v1.0.0"...');
  const releaseTime = new Date();
  const publishedPayload = JSON.stringify({
    action: 'published',
    release: {
      id: 11102,
      tag_name: 'v1.0.0',
      name: 'Galactic Engine Milestone',
      published_at: releaseTime.toISOString(),
      draft: false,
      prerelease: false,
    },
    repository: {
      name: 'deep-space-probe',
      full_name: 'release-voyager/deep-space-probe',
      html_url: 'https://github.com/release-voyager/deep-space-probe',
      owner: {
        id: testGithubId,
        login: 'release-voyager',
      },
    },
    sender: {
      id: testGithubId,
      login: 'release-voyager',
    },
  });

  const reqPublished = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'release',
      'x-hub-signature-256': createHmacSignature(publishedPayload, secret),
    },
    body: publishedPayload,
  });

  const resPublished = await POST(reqPublished);
  const jsonPublished = await resPublished.json();
  console.log(`   ✓ Status: ${resPublished.status}`, jsonPublished);
  if (resPublished.status !== 200 || !jsonPublished.releaseId) {
    throw new Error('Valid published release event failed');
  }

  // 4. Verify in Neon Database
  console.log('\n4. Verifying release in Neon DB releases table...');
  const [dbRelease] = await db
    .select()
    .from(releases)
    .where(eq(releases.tagName, 'v1.0.0'));

  console.log(`   ✓ Release record: ID = ${dbRelease.id}, Tag = ${dbRelease.tagName}, Name = ${dbRelease.releaseName}`);
  if (!dbRelease || dbRelease.tagName !== 'v1.0.0' || dbRelease.releaseName !== 'Galactic Engine Milestone') {
    throw new Error('Database release record verification failed');
  }

  // 5. Test idempotency (redelivered release event does not duplicate)
  console.log('\n5. Testing release idempotency on redelivered webhook...');
  const reqRedelivery = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'release',
      'x-hub-signature-256': createHmacSignature(publishedPayload, secret),
    },
    body: publishedPayload,
  });
  const resRedelivery = await POST(reqRedelivery);
  const jsonRedelivery = await resRedelivery.json();
  console.log(`   ✓ Redelivery status: ${resRedelivery.status}`, jsonRedelivery);
  const dbReleasesCount = await db.select().from(releases).where(eq(releases.tagName, 'v1.0.0'));
  console.log(`   ✓ Row count for v1.0.0 in DB: ${dbReleasesCount.length} (Expected: 1)`);
  if (dbReleasesCount.length !== 1) {
    throw new Error('Idempotency failed: duplicated release row');
  }

  // 6. Verify Galaxy API endpoint includes releases
  console.log('\n6. Verifying Galaxy API endpoint (/api/galaxy/release-voyager)...');
  const reqGalaxy = new NextRequest('http://localhost:3000/api/galaxy/release-voyager');
  const resGalaxy = await GET(reqGalaxy, { params: { username: 'release-voyager' } });
  const jsonGalaxy = await resGalaxy.json();

  console.log(`   ✓ Galaxy API status: ${resGalaxy.status}`);
  console.log(`   ✓ Releases array length: ${jsonGalaxy.releases?.length}`);
  const apiRelease = jsonGalaxy.releases?.[0];
  console.log(`   ✓ Found release in API:`, apiRelease);
  if (!apiRelease || apiRelease.tagName !== 'v1.0.0') {
    throw new Error('Galaxy API did not return the expected release');
  }

  // Cleanup test user
  await db.delete(users).where(eq(users.id, testUser.id));
  console.log('\n✓ Cleaned up test data.');
  console.log('\n🌟 ALL TAGGED RELEASE & SUPERNOVA MILESTONE TESTS PASSED!');
}

runReleaseTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Release test failed:', err);
    process.exit(1);
  });
