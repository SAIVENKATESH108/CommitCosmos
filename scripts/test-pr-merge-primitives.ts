import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/webhooks/github/route';
import { GET } from '../app/api/galaxy/[username]/route';
import { db, users, commits, projects } from '../db';
import { eq } from 'drizzle-orm';
import { StarFactory } from '../lib/galaxy/StarFactory';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runPrMergeTests() {
  console.log('=== Modern Git Primitives: PR Merge Visual Distinction Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test User
  console.log('1. Setting up test user in Neon DB...');
  const testGithubId = 99933301;
  await db.delete(users).where(eq(users.githubId, testGithubId));

  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: 'pr-cosmonaut',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99933301',
    })
    .returning();

  console.log(`   ✓ Created User: ID = ${testUser.id}, @${testUser.githubUsername}`);

  // 2. Test GitHub 'push' event with a Merge Commit ("Merge pull request #108 from dev")
  console.log('\n2. Testing Push event containing a PR merge commit message...');
  const pushPayload = JSON.stringify({
    ref: 'refs/heads/main',
    repository: {
      name: 'cosmic-dock',
      full_name: 'pr-cosmonaut/cosmic-dock',
      html_url: 'https://github.com/pr-cosmonaut/cosmic-dock',
      owner: {
        id: testGithubId,
        login: 'pr-cosmonaut',
      },
    },
    sender: {
      id: testGithubId,
      login: 'pr-cosmonaut',
    },
    commits: [
      {
        id: 'sha-solo-commit-101',
        message: 'fix: align docking clamp tolerances',
        timestamp: new Date().toISOString(),
        added: ['src/clamp.ts'],
        removed: [],
        modified: [],
      },
      {
        id: 'sha-pr-merge-108',
        message: 'Merge pull request #108 from pr-cosmonaut/feature-docking\n\nAdd magnetic docking clamps',
        timestamp: new Date().toISOString(),
        added: ['src/dock.ts', 'src/clamp.ts'],
        removed: [],
        modified: [],
      },
    ],
  });

  const reqPush = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'push',
      'x-hub-signature-256': createHmacSignature(pushPayload, secret),
      'content-type': 'application/json',
    },
    body: pushPayload,
  });

  const resPush = await POST(reqPush);
  const pushResult = await resPush.json();
  console.log('   ✓ Push Webhook Response:', pushResult);

  // 3. Test GitHub 'pull_request' webhook event (closed + merged: true)
  console.log('\n3. Testing GitHub "pull_request" event (closed + merged = true)...');
  const prPayload = JSON.stringify({
    action: 'closed',
    number: 215,
    pull_request: {
      id: 777215,
      number: 215,
      state: 'closed',
      title: 'feat: quantum propulsion accretion drive',
      merged: true,
      merged_at: new Date().toISOString(),
      merge_commit_sha: 'sha-pr-accretion-215',
    },
    repository: {
      name: 'cosmic-dock',
      full_name: 'pr-cosmonaut/cosmic-dock',
      html_url: 'https://github.com/pr-cosmonaut/cosmic-dock',
      owner: {
        id: testGithubId,
        login: 'pr-cosmonaut',
      },
    },
    sender: {
      id: testGithubId,
      login: 'pr-cosmonaut',
    },
  });

  const reqPr = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'pull_request',
      'x-hub-signature-256': createHmacSignature(prPayload, secret),
      'content-type': 'application/json',
    },
    body: prPayload,
  });

  const resPr = await POST(reqPr);
  const prResult = await resPr.json();
  console.log('   ✓ Pull Request Webhook Response:', prResult);

  // 4. Verify Database Records
  console.log('\n4. Verifying Neon Postgres commit records for PR flags...');
  const dbCommits = await db.query.commits.findMany({
    where: (c, { inArray }) =>
      inArray(c.sha, ['sha-solo-commit-101', 'sha-pr-merge-108', 'sha-pr-accretion-215']),
  });

  for (const c of dbCommits) {
    console.log(
      `   Commit ${c.sha}: is_pr_merge=${c.isPrMerge}, pr_number=${c.prNumber}, magnitude=${c.magnitude}`
    );
  }

  const solo = dbCommits.find((c) => c.sha === 'sha-solo-commit-101');
  const pr108 = dbCommits.find((c) => c.sha === 'sha-pr-merge-108');
  const pr215 = dbCommits.find((c) => c.sha === 'sha-pr-accretion-215');

  if (solo?.isPrMerge !== false) {
    throw new Error('Expected solo commit isPrMerge to be false');
  }
  if (pr108?.isPrMerge !== true || pr108?.prNumber !== 108) {
    throw new Error(`Expected pr108 isPrMerge=true, prNumber=108, got ${pr108?.isPrMerge}, ${pr108?.prNumber}`);
  }
  if (pr215?.isPrMerge !== true || pr215?.prNumber !== 215) {
    throw new Error(`Expected pr215 isPrMerge=true, prNumber=215, got ${pr215?.isPrMerge}, ${pr215?.prNumber}`);
  }
  console.log('   ✓ DB commit records accurately flagged!');

  // 5. Query Galaxy API Endpoint
  console.log('\n5. Querying GET /api/galaxy/pr-cosmonaut ...');
  const reqGalaxy = new NextRequest('http://localhost:3000/api/galaxy/pr-cosmonaut');
  const resGalaxy = await GET(reqGalaxy, { params: { username: 'pr-cosmonaut' } });
  const galaxyData = await resGalaxy.json();

  console.log(`   ✓ Stars returned: ${galaxyData.stars.length}`);
  const starPr108 = galaxyData.stars.find((s: any) => s.sha === 'sha-pr-merge-108');
  const starPr215 = galaxyData.stars.find((s: any) => s.sha === 'sha-pr-accretion-215');
  const starSolo = galaxyData.stars.find((s: any) => s.sha === 'sha-solo-commit-101');

  console.log(`   Solo star isPrMerge: ${starSolo?.isPrMerge}`);
  console.log(`   PR #108 star isPrMerge: ${starPr108?.isPrMerge}, prNumber: ${starPr108?.prNumber}`);
  console.log(`   PR #215 star isPrMerge: ${starPr215?.isPrMerge}, prNumber: ${starPr215?.prNumber}`);

  if (!starPr108?.isPrMerge || starPr108?.prNumber !== 108) {
    throw new Error('Galaxy API failed to expose isPrMerge or prNumber for PR #108');
  }
  if (!starPr215?.isPrMerge || starPr215?.prNumber !== 215) {
    throw new Error('Galaxy API failed to expose isPrMerge or prNumber for PR #215');
  }

  // 6. Test Star Domain Model Instantiation via StarFactory
  console.log('\n6. Testing StarFactory domain model generation...');
  const domainStar = StarFactory.fromCommit(starPr215, 0, 1, 45);
  console.log(`   Domain Star isPrMerge: ${domainStar.isPrMerge}`);
  console.log(`   Domain Star prNumber: ${domainStar.prNumber}`);
  console.log(`   Domain Star primaryColor: ${domainStar.color}`);
  console.log(`   Domain Star secondaryColor: ${domainStar.secondaryColor}`);

  if (!domainStar.isPrMerge || domainStar.prNumber !== 215 || !domainStar.secondaryColor) {
    throw new Error('StarFactory failed to generate dual-color PR merge star attributes');
  }
  console.log('   ✓ Star domain model successfully configured for dual-color accretion rendering!');

  // 7. Cleanup
  console.log('\n7. Cleaning up test records...');
  await db.delete(users).where(eq(users.githubId, testGithubId));
  console.log('   ✓ Cleaned up test user.\n');

  console.log('🎉 ALL PR MERGE PRIMITIVE TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runPrMergeTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
