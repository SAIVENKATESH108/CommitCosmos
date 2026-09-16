import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/webhooks/github/route';
import { GET } from '../app/api/galaxy/[username]/route';
import { db, users, branches, commits, projects } from '../db';
import { eq, and } from 'drizzle-orm';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runBranchTests() {
  console.log('=== Modern Git Primitives: Branch Tracking & Orbiting Moons Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test User
  console.log('1. Setting up test user in Neon DB...');
  const testGithubId = 88822201;
  await db.delete(users).where(eq(users.githubId, testGithubId));

  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: 'branch-explorer',
      avatarUrl: 'https://avatars.githubusercontent.com/u/88822201',
    })
    .returning();

  console.log(`   ✓ Created User: ID = ${testUser.id}, @${testUser.githubUsername}`);

  // 2. Test GitHub 'create' Webhook Event (New Branch Created)
  console.log('\n2. Sending GitHub "create" event for new branch "feature/warp-drive"...');
  const createPayload = JSON.stringify({
    ref_type: 'branch',
    ref: 'feature/warp-drive',
    repository: {
      name: 'interstellar-nav',
      full_name: 'branch-explorer/interstellar-nav',
      html_url: 'https://github.com/branch-explorer/interstellar-nav',
      default_branch: 'main',
      owner: {
        id: testGithubId,
        login: 'branch-explorer',
      },
    },
    sender: {
      id: testGithubId,
      login: 'branch-explorer',
    },
  });

  const reqCreate = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'create',
      'x-hub-signature-256': createHmacSignature(createPayload, secret),
    },
    body: createPayload,
  });

  const resCreate = await POST(reqCreate);
  const jsonCreate = await resCreate.json();
  console.log(`   ✓ Status: ${resCreate.status}`, jsonCreate);
  if (resCreate.status !== 200 || !jsonCreate.success) {
    throw new Error('Create branch event failed');
  }

  // Verify branch in database
  const [dbBranch] = await db
    .select()
    .from(branches)
    .where(eq(branches.branchName, 'feature/warp-drive'));

  console.log(`   ✓ Branch in DB: ID = ${dbBranch.id}, isDefault = ${dbBranch.isDefault}, mergedAt = ${dbBranch.mergedAt}`);
  if (!dbBranch || dbBranch.isDefault !== false || dbBranch.mergedAt !== null) {
    throw new Error('Database branch state does not match expected active non-default branch');
  }

  // 3. Test GitHub 'push' Webhook Event to the branch
  console.log('\n3. Sending GitHub "push" event with commits on "feature/warp-drive"...');
  const now = new Date();
  const pushPayload = JSON.stringify({
    ref: 'refs/heads/feature/warp-drive',
    repository: {
      name: 'interstellar-nav',
      full_name: 'branch-explorer/interstellar-nav',
      html_url: 'https://github.com/branch-explorer/interstellar-nav',
      default_branch: 'main',
      owner: {
        id: testGithubId,
        login: 'branch-explorer',
      },
    },
    commits: [
      {
        id: 'wd11111111111111111111111111111111111111',
        message: 'Initialize antimatter reactor equations',
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        added: ['warp/core.ts', 'warp/plasma.ts'],
        removed: [],
        modified: ['nav/chart.ts'],
      },
      {
        id: 'wd22222222222222222222222222222222222222',
        message: 'Calibrate subspace warp field coils',
        timestamp: now.toISOString(),
        added: ['warp/coils.ts'],
        removed: [],
        modified: [],
      },
    ],
    sender: {
      id: testGithubId,
      login: 'branch-explorer',
    },
  });

  const reqPush = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'push',
      'x-hub-signature-256': createHmacSignature(pushPayload, secret),
    },
    body: pushPayload,
  });

  const resPush = await POST(reqPush);
  const jsonPush = await resPush.json();
  console.log(`   ✓ Status: ${resPush.status}`, jsonPush);
  if (resPush.status !== 200 || jsonPush.inserted !== 2) {
    throw new Error(`Push event failed, expected 2 inserted commits, got ${jsonPush.inserted}`);
  }

  // Verify commits in DB are associated with branchId
  const dbCommits = await db
    .select()
    .from(commits)
    .where(eq(commits.branchId, dbBranch.id));

  console.log(`   ✓ Found ${dbCommits.length} commits associated with branch ID ${dbBranch.id}`);
  if (dbCommits.length !== 2) {
    throw new Error('Commits were not properly associated with the branch ID');
  }

  // 4. Test Galaxy API endpoint returns branches & branchId on commits
  console.log('\n4. Verifying Galaxy API endpoint (/api/galaxy/branch-explorer)...');
  const reqGalaxy = new NextRequest('http://localhost:3000/api/galaxy/branch-explorer');
  const resGalaxy = await GET(reqGalaxy, { params: { username: 'branch-explorer' } });
  const jsonGalaxy = await resGalaxy.json();

  console.log(`   ✓ Galaxy API status: ${resGalaxy.status}`);
  console.log(`   ✓ Total stars: ${jsonGalaxy.totalStars}`);
  console.log(`   ✓ Branches returned: ${jsonGalaxy.branches?.length}`);
  const returnedBranch = jsonGalaxy.branches?.find((b: any) => b.branchName === 'feature/warp-drive');
  console.log(`   ✓ Found branch in API:`, returnedBranch);
  if (!returnedBranch || returnedBranch.mergedAt !== null) {
    throw new Error('Galaxy API did not return the expected active branch');
  }

  const branchStars = jsonGalaxy.stars.filter((s: any) => s.branchId === dbBranch.id);
  console.log(`   ✓ Stars tagged with branchId: ${branchStars.length}`);
  if (branchStars.length !== 2) {
    throw new Error('Stars array did not preserve branchId association');
  }

  // 5. Test GitHub 'delete' Webhook Event (Branch Merged / Deleted)
  console.log('\n5. Sending GitHub "delete" event for branch "feature/warp-drive" (merged)...');
  const deletePayload = JSON.stringify({
    ref_type: 'branch',
    ref: 'feature/warp-drive',
    repository: {
      name: 'interstellar-nav',
      full_name: 'branch-explorer/interstellar-nav',
      html_url: 'https://github.com/branch-explorer/interstellar-nav',
      default_branch: 'main',
      owner: {
        id: testGithubId,
        login: 'branch-explorer',
      },
    },
    sender: {
      id: testGithubId,
      login: 'branch-explorer',
    },
  });

  const reqDelete = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'delete',
      'x-hub-signature-256': createHmacSignature(deletePayload, secret),
    },
    body: deletePayload,
  });

  const resDelete = await POST(reqDelete);
  const jsonDelete = await resDelete.json();
  console.log(`   ✓ Status: ${resDelete.status}`, jsonDelete);
  if (resDelete.status !== 200 || !jsonDelete.mergedAt) {
    throw new Error('Delete event failed or mergedAt was not returned');
  }

  // Verify in database that merged_at is now set
  const [mergedBranch] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, dbBranch.id));

  console.log(`   ✓ Branch in DB now has mergedAt: ${mergedBranch.mergedAt?.toISOString()}`);
  if (!mergedBranch.mergedAt) {
    throw new Error('Database merged_at was not updated on delete event');
  }

  // 6. Verify Galaxy API returns updated branch with mergedAt
  console.log('\n6. Verifying Galaxy API reflects merged branch...');
  const resGalaxyAfter = await GET(reqGalaxy, { params: { username: 'branch-explorer' } });
  const jsonGalaxyAfter = await resGalaxyAfter.json();
  const returnedMergedBranch = jsonGalaxyAfter.branches?.find((b: any) => b.id === dbBranch.id);

  console.log(`   ✓ Branch in Galaxy API mergedAt: ${returnedMergedBranch?.mergedAt}`);
  if (!returnedMergedBranch?.mergedAt) {
    throw new Error('Galaxy API did not reflect mergedAt timestamp');
  }

  // Cleanup test user
  await db.delete(users).where(eq(users.id, testUser.id));
  console.log('\n✓ Cleaned up test data.');
  console.log('\n🌟 ALL MODERN GIT PRIMITIVE BRANCH TESTS PASSED!');
}

runBranchTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
