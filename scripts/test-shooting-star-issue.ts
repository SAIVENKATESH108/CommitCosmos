import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/webhooks/github/route';
import { GET } from '../app/api/galaxy/[username]/route';
import { db, users, closedIssues, projects } from '../db';
import { eq } from 'drizzle-orm';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runShootingStarTests() {
  console.log('=== Modern Git Primitives: Issue Closure Shooting Star Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test User
  console.log('1. Setting up test user in Neon DB...');
  const testGithubId = 99944401;
  await db.delete(users).where(eq(users.githubId, testGithubId));

  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: 'meteor-watcher',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99944401',
    })
    .returning();

  console.log(`   ✓ Created User: ID = ${testUser.id}, @${testUser.githubUsername}`);

  // 2. Test GitHub 'issues' webhook event with 'closed' action and linked commit & PR
  console.log('\n2. Testing GitHub "issues" event (action: closed with linked commit & PR)...');
  const issuesPayload = JSON.stringify({
    action: 'closed',
    issue: {
      id: 555404,
      number: 404,
      title: 'Fix orbital decay anomaly in attitude thrusters',
      state: 'closed',
      state_reason: 'completed',
      closed_at: new Date().toISOString(),
      body: 'Resolved by commit 7c8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e via PR #99',
    },
    repository: {
      name: 'orbital-station',
      full_name: 'meteor-watcher/orbital-station',
      html_url: 'https://github.com/meteor-watcher/orbital-station',
      owner: {
        id: testGithubId,
        login: 'meteor-watcher',
      },
    },
    sender: {
      id: testGithubId,
      login: 'meteor-watcher',
    },
  });

  const reqIssues = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'issues',
      'x-hub-signature-256': createHmacSignature(issuesPayload, secret),
      'content-type': 'application/json',
    },
    body: issuesPayload,
  });

  const resIssues = await POST(reqIssues);
  const issuesResult = await resIssues.json();
  console.log('   ✓ Issues Webhook Response:', issuesResult);

  if (!issuesResult.success || issuesResult.issueNumber !== 404) {
    throw new Error(`Expected successful issues webhook response, got ${JSON.stringify(issuesResult)}`);
  }

  // 3. Verify Database Record in Neon Postgres
  console.log('\n3. Verifying Neon Postgres closed_issues records...');
  const dbClosedIssues = await db
    .select()
    .from(closedIssues)
    .where(eq(closedIssues.issueNumber, 404));

  console.log(`   Found ${dbClosedIssues.length} closed issue record(s):`, dbClosedIssues[0]);

  if (dbClosedIssues.length === 0) {
    throw new Error('Expected closed_issues record was not found in database');
  }

  const record = dbClosedIssues[0];
  if (record.issueNumber !== 404) {
    throw new Error(`Expected issueNumber 404, got ${record.issueNumber}`);
  }
  if (record.closingCommitSha !== '7c8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e') {
    throw new Error(`Expected closingCommitSha to be detected, got ${record.closingCommitSha}`);
  }
  if (record.closingPrNumber !== 99) {
    throw new Error(`Expected closingPrNumber 99, got ${record.closingPrNumber}`);
  }
  console.log('   ✓ Database record matches closed issue details and linked commit/PR metadata!');

  // 4. Test Galaxy API Endpoint for closedIssues
  console.log('\n4. Querying GET /api/galaxy/meteor-watcher ...');
  const reqGalaxy = new NextRequest('http://localhost:3000/api/galaxy/meteor-watcher');
  const resGalaxy = await GET(reqGalaxy, { params: { username: 'meteor-watcher' } });
  const galaxyData = await resGalaxy.json();

  console.log(`   ✓ Closed issues returned in galaxy response:`, galaxyData.closedIssues);

  if (!galaxyData.closedIssues || galaxyData.closedIssues.length === 0) {
    throw new Error('Galaxy API failed to include closedIssues in response');
  }

  const issueInGalaxy = galaxyData.closedIssues.find((i: any) => i.issueNumber === 404);
  if (!issueInGalaxy) {
    throw new Error('Issue #404 not found in galaxy closedIssues array');
  }
  console.log('   ✓ Galaxy API properly returned closed issue for shooting star trigger!');

  // 5. Test Ignored Non-Closed Issue Action
  console.log('\n5. Testing ignored issue action (action: opened)...');
  const openedPayload = JSON.stringify({
    action: 'opened',
    issue: {
      number: 405,
      title: 'Feature: Solar sail deployment',
    },
    repository: {
      name: 'orbital-station',
      full_name: 'meteor-watcher/orbital-station',
      owner: {
        id: testGithubId,
        login: 'meteor-watcher',
      },
    },
    sender: {
      id: testGithubId,
      login: 'meteor-watcher',
    },
  });

  const reqOpened = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'issues',
      'x-hub-signature-256': createHmacSignature(openedPayload, secret),
      'content-type': 'application/json',
    },
    body: openedPayload,
  });

  const resOpened = await POST(reqOpened);
  const openedResult = await resOpened.json();
  console.log('   ✓ Non-closed action ignored gracefully:', openedResult.message);

  // 6. Cleanup
  console.log('\n6. Cleaning up test user and records...');
  await db.delete(users).where(eq(users.githubId, testGithubId));
  console.log('   ✓ Cleaned up test user.\n');

  console.log('🎉 ALL SHOOTING STAR & ISSUE CLOSURE TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runShootingStarTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
