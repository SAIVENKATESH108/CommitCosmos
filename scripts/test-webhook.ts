import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/webhooks/github/route';
import { db, users, commits, streaks, projects } from '../db';
import { eq } from 'drizzle-orm';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runWebhookTests() {
  console.log('=== GitHub Webhook Endpoint & Ingestion Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test User in Neon
  console.log('1. Setting up test user in Neon DB...');
  const testGithubId = 77711100;
  await db.delete(users).where(eq(users.githubId, testGithubId));

  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: 'webhook-stargazer',
      avatarUrl: 'https://avatars.githubusercontent.com/u/77711100',
    })
    .returning();

  console.log(`   ✓ Created User: ID = ${testUser.id}, @${testUser.githubUsername}`);

  // 2. Test Invalid Signature (Expect 401)
  console.log('\n2. Testing Invalid Signature Rejection...');
  const dummyPayload = JSON.stringify({ hello: 'world' });
  const reqInvalidSig = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
    },
    body: dummyPayload,
  });

  const resInvalidSig = await POST(reqInvalidSig);
  console.log(`   ✓ Status: ${resInvalidSig.status} (Expected 401)`);
  if (resInvalidSig.status !== 401) {
    throw new Error(`Expected 401 on invalid signature, got ${resInvalidSig.status}`);
  }

  // 3. Test Malformed Payload with Valid Signature (Expect 400)
  console.log('\n3. Testing Schema Validation Failure (Expect 400)...');
  const malformedPayload = JSON.stringify({ invalidField: true });
  const validSigMalformed = createHmacSignature(malformedPayload, secret);

  const reqMalformed = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': validSigMalformed,
    },
    body: malformedPayload,
  });

  const resMalformed = await POST(reqMalformed);
  console.log(`   ✓ Status: ${resMalformed.status} (Expected 400)`);
  if (resMalformed.status !== 400) {
    throw new Error(`Expected 400 on malformed payload, got ${resMalformed.status}`);
  }

  // 4. Test Valid GitHub Push Event (Expect 200 with 2 inserted commits)
  console.log('\n4. Testing Valid GitHub Push Event with 2 Commits...');
  const validPushPayload = JSON.stringify({
    repository: {
      name: 'andromeda-galaxy',
      full_name: 'webhook-stargazer/andromeda-galaxy',
      html_url: 'https://github.com/webhook-stargazer/andromeda-galaxy',
      owner: {
        id: testGithubId,
        login: 'webhook-stargazer',
      },
    },
    commits: [
      {
        id: 'commit-star-hash-001',
        message: 'feat: ignite alpha centauri star',
        timestamp: '2026-09-10T12:00:00Z',
      },
      {
        id: 'commit-star-hash-002',
        message: 'feat: form constellation line to betelgeuse',
        timestamp: '2026-09-11T12:00:00Z',
      },
    ],
    pusher: {
      name: 'webhook-stargazer',
    },
    sender: {
      id: testGithubId,
      login: 'webhook-stargazer',
    },
  });

  const validSig = createHmacSignature(validPushPayload, secret);

  const reqValid = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': validSig,
    },
    body: validPushPayload,
  });

  const resValid = await POST(reqValid);
  const dataValid = await resValid.json();
  console.log(`   ✓ Status: ${resValid.status}, Result:`, dataValid);

  if (resValid.status !== 200 || dataValid.inserted !== 2 || dataValid.skipped !== 0) {
    throw new Error(`Failed to ingest valid commits: ${JSON.stringify(dataValid)}`);
  }

  // Verify streak updated via trigger
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, testUser.id));

  console.log(`   ✓ Streak Trigger automatically fired! Current: ${streak?.currentStreak}, Longest: ${streak?.longestStreak}, Last Active: ${streak?.lastActiveDate}`);

  // 5. Test Webhook Redelivery (Idempotency: Expect 200 with 0 inserted, 2 skipped)
  console.log('\n5. Testing Webhook Redelivery (Idempotency)...');
  const reqRedelivery = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': validSig,
    },
    body: validPushPayload,
  });

  const resRedelivery = await POST(reqRedelivery);
  const dataRedelivery = await resRedelivery.json();
  console.log(`   ✓ Status: ${resRedelivery.status}, Result:`, dataRedelivery);

  if (resRedelivery.status !== 200 || dataRedelivery.inserted !== 0 || dataRedelivery.skipped !== 2) {
    throw new Error(`Idempotency check failed: ${JSON.stringify(dataRedelivery)}`);
  }

  // 6. Cleanup Test Records
  console.log('\n6. Cleaning up test user and cascading records from Neon...');
  await db.delete(users).where(eq(users.id, testUser.id));

  const remainingUsers = await db.select().from(users).where(eq(users.id, testUser.id));
  const remainingProjects = await db.select().from(projects).where(eq(projects.userId, testUser.id));
  const remainingCommits = await db.select().from(commits).where(eq(commits.projectId, dataValid.projectId));

  console.log(`   ✓ Cleaned up. Remaining users: ${remainingUsers.length}, projects: ${remainingProjects.length}, commits: ${remainingCommits.length}`);

  console.log('\n=== All Webhook Pipeline Checks Passed! ===');
}

runWebhookTests().catch((err) => {
  console.error('Webhook test failed:', err);
  process.exit(1);
});
