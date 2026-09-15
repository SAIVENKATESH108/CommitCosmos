import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '../db';
import { users, projects, commits, constellations } from '../db/schema';
import { eq } from 'drizzle-orm';
import { POST as webhookPOST } from '../app/api/webhooks/github/route';
import { GET as galaxyGET } from '../app/api/galaxy/[username]/route';
import { GET as statsGET } from '../app/api/stats/[username]/route';

function createHmacSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function testReadRoutes() {
  console.log('=== CommitCosmos Read API Routes Test ===\n');

  const testGithubId = 88822211;
  const testUsername = 'galaxy-explorer';
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'dev_secret_commitcosmos_2026';

  // 1. Clean up any leftover test data
  await db.delete(users).where(eq(users.githubId, testGithubId));

  // 2. Insert test user
  console.log('1. Setting up test user in database...');
  const [testUser] = await db
    .insert(users)
    .values({
      githubId: testGithubId,
      githubUsername: testUsername,
      avatarUrl: 'https://avatars.githubusercontent.com/u/88822211?v=4',
    })
    .returning();
  console.log(`   ✓ Created user: @${testUser.githubUsername} (${testUser.id})`);

  // 3. Ingest real commits through the Prompt 6 Webhook
  console.log('\n2. Ingesting commits through GitHub webhook endpoint...');
  const webhookPayload = JSON.stringify({
    repository: {
      name: 'orion-nebula',
      full_name: `${testUsername}/orion-nebula`,
      html_url: `https://github.com/${testUsername}/orion-nebula`,
      owner: {
        id: testGithubId,
        login: testUsername,
      },
    },
    commits: [
      {
        id: 'sha-nebula-star-101',
        message: 'feat(core): initialize star core engine in TypeScript',
        timestamp: '2026-09-14T10:00:00Z',
      },
      {
        id: 'sha-nebula-star-102',
        message: 'feat(render): add python shader orbits',
        timestamp: '2026-09-15T08:30:00Z',
      },
    ],
    pusher: { name: testUsername },
    sender: { id: testGithubId, login: testUsername },
  });

  const webhookReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': createHmacSignature(webhookPayload, secret),
    },
    body: webhookPayload,
  });

  const webhookRes = await webhookPOST(webhookReq);
  const webhookData = await webhookRes.json();
  console.log(`   ✓ Webhook response status: ${webhookRes.status}`, webhookData);

  // Update commits with languages to test star color mapping
  const userProjects = await db.select().from(projects).where(eq(projects.userId, testUser.id));
  if (userProjects.length > 0) {
    await db
      .update(commits)
      .set({ language: 'TypeScript' })
      .where(eq(commits.sha, 'sha-nebula-star-101'));
    await db
      .update(commits)
      .set({ language: 'Python' })
      .where(eq(commits.sha, 'sha-nebula-star-102'));
    console.log('   ✓ Set languages: sha-nebula-star-101 -> TypeScript, sha-nebula-star-102 -> Python');
  }

  // Add an unlocked constellation for testing
  await db.insert(constellations).values({
    userId: testUser.id,
    name: 'Ursa Major',
    streakLength: 3,
  });
  console.log('   ✓ Inserted test constellation: Ursa Major (streak: 3)');

  // 4. Test GET /app/api/galaxy/[username]/route.ts
  console.log('\n3. Testing GET /api/galaxy/[username]...');

  // 4a. Bad username validation (Zod)
  console.log('   3a. Testing invalid username parameter validation...');
  const badGalaxyReq = new NextRequest(`http://localhost:3000/api/galaxy/invalid--username!@#`);
  const badGalaxyRes = await galaxyGET(badGalaxyReq, {
    params: { username: 'invalid--username!@#' },
  });
  console.log(`       ✓ Status: ${badGalaxyRes.status} (Expected 400)`);
  if (badGalaxyRes.status !== 400) {
    throw new Error(`Expected 400 for bad username, got ${badGalaxyRes.status}`);
  }

  // 4b. Non-existent user (404)
  console.log('   3b. Testing 404 for non-existent user...');
  const missingGalaxyReq = new NextRequest('http://localhost:3000/api/galaxy/nonexistent-user-999');
  const missingGalaxyRes = await galaxyGET(missingGalaxyReq, {
    params: { username: 'nonexistent-user-999' },
  });
  console.log(`       ✓ Status: ${missingGalaxyRes.status} (Expected 404)`);
  if (missingGalaxyRes.status !== 404) {
    throw new Error(`Expected 404 for nonexistent user, got ${missingGalaxyRes.status}`);
  }

  // 4c. Valid Galaxy Request
  console.log('   3c. Testing valid galaxy request for existing user...');
  const validGalaxyReq = new NextRequest(`http://localhost:3000/api/galaxy/${testUsername}`);
  const validGalaxyRes = await galaxyGET(validGalaxyReq, {
    params: { username: testUsername },
  });
  const galaxyData = await validGalaxyRes.json();
  console.log(`       ✓ Status: ${validGalaxyRes.status} (Expected 200)`);
  console.log('       ✓ Galaxy response data summary:');
  console.log('         - user:', galaxyData.user);
  console.log('         - stars count:', galaxyData.stars?.length);
  console.log('         - stars sample:', galaxyData.stars);
  console.log('         - clusters count:', galaxyData.clusters?.length);
  console.log('         - constellations count:', galaxyData.constellations?.length);
  console.log('         - constellations sample:', galaxyData.constellations);

  // Validate star colors
  const tsStar = (galaxyData.stars as { sha: string; color: string }[]).find((s) => s.sha === 'sha-nebula-star-101');
  const pyStar = (galaxyData.stars as { sha: string; color: string }[]).find((s) => s.sha === 'sha-nebula-star-102');
  console.log(`       ✓ TypeScript star color: ${tsStar?.color} (Expected #38bdf8)`);
  console.log(`       ✓ Python star color: ${pyStar?.color} (Expected #60a5fa)`);

  if (tsStar?.color !== '#38bdf8' || pyStar?.color !== '#60a5fa') {
    throw new Error(`Star color mismatch! TS: ${tsStar?.color}, Py: ${pyStar?.color}`);
  }

  // 5. Test GET /app/api/stats/[username]/route.ts
  console.log('\n4. Testing GET /api/stats/[username]...');

  // 5a. Bad username validation (Zod)
  console.log('   4a. Testing invalid username parameter validation...');
  const badStatsReq = new NextRequest(`http://localhost:3000/api/stats/invalid--user!`);
  const badStatsRes = await statsGET(badStatsReq, {
    params: { username: 'invalid--user!' },
  });
  console.log(`       ✓ Status: ${badStatsRes.status} (Expected 400)`);
  if (badStatsRes.status !== 400) {
    throw new Error(`Expected 400 for bad username, got ${badStatsRes.status}`);
  }

  // 5b. Non-existent user (404)
  console.log('   4b. Testing 404 for non-existent user stats...');
  const missingStatsReq = new NextRequest('http://localhost:3000/api/stats/nonexistent-user-999');
  const missingStatsRes = await statsGET(missingStatsReq, {
    params: { username: 'nonexistent-user-999' },
  });
  console.log(`       ✓ Status: ${missingStatsRes.status} (Expected 404)`);
  if (missingStatsRes.status !== 404) {
    throw new Error(`Expected 404 for nonexistent user stats, got ${missingStatsRes.status}`);
  }

  // 5c. Valid Stats Request
  console.log('   4c. Testing valid stats request for existing user...');
  const validStatsReq = new NextRequest(`http://localhost:3000/api/stats/${testUsername}`);
  const validStatsRes = await statsGET(validStatsReq, {
    params: { username: testUsername },
  });
  const statsData = await validStatsRes.json();
  console.log(`       ✓ Status: ${validStatsRes.status} (Expected 200)`);
  console.log('       ✓ Stats response data:');
  console.log('         - userId:', statsData.userId);
  console.log('         - githubUsername:', statsData.githubUsername);
  console.log('         - totalCommits:', statsData.totalCommits);
  console.log('         - totalProjects:', statsData.totalProjects);
  console.log('         - currentStreak:', statsData.currentStreak);
  console.log('         - longestStreak:', statsData.longestStreak);

  if (
    statsData.githubUsername !== testUsername ||
    typeof statsData.totalCommits !== 'number' ||
    typeof statsData.totalProjects !== 'number'
  ) {
    throw new Error(`Unexpected stats data shape: ${JSON.stringify(statsData)}`);
  }

  // 6. Cleanup
  console.log('\n5. Cleaning up test data from Neon DB...');
  await db.delete(users).where(eq(users.id, testUser.id));
  console.log('   ✓ Cleaned up test user and cascading rows');

  console.log('\n=== All Read API Routes Verified Successfully! ===');
}

testReadRoutes().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
