import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST as postWebhook } from '../app/api/webhooks/github/route';
import { GET as getTeamGalaxy } from '../app/api/teams/[teamId]/galaxy/route';
import { POST as postTeamMember } from '../app/api/teams/[teamId]/members/route';
import { db, users, projects, teams, teamMembers, commits } from '../db';
import { eq } from 'drizzle-orm';
import { createTeam, assignProjectToTeam, getTeamMembers } from '../db/repositories/teamRepository';

function createHmacSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runTeamTests() {
  console.log('=== Modern Git Primitives: Teams & Multi-Author Star Systems Test ===\n');

  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  // 1. Setup Test Users: Alice (creator) and Bob (collaborator)
  console.log('1. Setting up test users in Neon DB...');
  const aliceGithubId = 99955501;
  const bobGithubId = 99955502;

  await db.delete(users).where(eq(users.githubId, aliceGithubId));
  await db.delete(users).where(eq(users.githubId, bobGithubId));

  const [alice] = await db
    .insert(users)
    .values({
      githubId: aliceGithubId,
      githubUsername: 'alice-astronomer',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99955501',
    })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      githubId: bobGithubId,
      githubUsername: 'bob-celestial',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99955502',
    })
    .returning();

  console.log(`   ✓ Alice: ID = ${alice.id}, @${alice.githubUsername}`);
  console.log(`   ✓ Bob: ID = ${bob.id}, @${bob.githubUsername}`);

  // 2. Create Team and Add Member
  console.log('\n2. Creating Team "Nebula Syndicate" with Alice as creator...');
  const team = await createTeam('Nebula Syndicate', alice.id);
  console.log(`   ✓ Team created: ID = ${team.id}, InviteCode = ${team.inviteCode}`);

  // 3. Test Ingesting multi-author commits via GitHub push webhook
  console.log('\n3. Ingesting multi-author commits for team project via GitHub push webhook...');
  const pushPayload = JSON.stringify({
    ref: 'refs/heads/main',
    repository: {
      name: 'nebula-engine',
      full_name: 'alice-astronomer/nebula-engine',
      html_url: 'https://github.com/alice-astronomer/nebula-engine',
      owner: {
        id: aliceGithubId,
        login: 'alice-astronomer',
      },
    },
    sender: {
      id: aliceGithubId,
      login: 'alice-astronomer',
    },
    commits: [
      {
        id: 'sha-alice-commit-001',
        message: 'feat: initialize cosmic propulsion reactor',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        author: {
          name: 'Alice Astronomer',
          username: 'alice-astronomer',
        },
      },
      {
        id: 'sha-bob-commit-002',
        message: 'fix: optimize warp containment field geometry',
        timestamp: new Date().toISOString(),
        author: {
          name: 'Bob Celestial',
          username: 'bob-celestial',
        },
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

  const resPush = await postWebhook(reqPush);
  const pushResult = await resPush.json();
  console.log('   ✓ Push Webhook Response:', pushResult);

  // 4. Assign the project to the team
  console.log('\n4. Assigning project to team...');
  await assignProjectToTeam(pushResult.projectId, team.id);
  console.log(`   ✓ Project ${pushResult.projectId} assigned to Team ${team.id}`);

  // 5. Test Invite Member API: Add Bob to the team
  console.log('\n5. Inviting Bob via POST /api/teams/[teamId]/members ...');
  const reqInvite = new NextRequest(`http://localhost:3000/api/teams/${team.id}/members`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ githubUsername: 'bob-celestial' }),
  });

  const resInvite = await postTeamMember(reqInvite, { params: { teamId: team.id } });
  const inviteResult = await resInvite.json();
  console.log('   ✓ Invite API Response:', inviteResult.message);
  console.log('   ✓ Members roster:', inviteResult.members.map((m: any) => `${m.githubUsername} (${m.color})`));

  if (inviteResult.members.length < 2) {
    throw new Error('Expected at least 2 team members in roster');
  }

  // 6. Test Team Galaxy API: GET /api/teams/[teamId]/galaxy
  console.log('\n6. Querying GET /api/teams/[teamId]/galaxy ...');
  const reqTeamGalaxy = new NextRequest(`http://localhost:3000/api/teams/${team.id}/galaxy`);
  const resTeamGalaxy = await getTeamGalaxy(reqTeamGalaxy, { params: { teamId: team.id } });
  const teamGalaxyData = await resTeamGalaxy.json();

  console.log(`   ✓ Team stars count: ${teamGalaxyData.stars.length}`);
  for (const s of teamGalaxyData.stars) {
    console.log(`   Star ${s.sha}: author=${s.authorUsername}, color=${s.color}`);
  }

  const aliceStar = teamGalaxyData.stars.find((s: any) => s.sha === 'sha-alice-commit-001');
  const bobStar = teamGalaxyData.stars.find((s: any) => s.sha === 'sha-bob-commit-002');

  if (!aliceStar || !bobStar) {
    throw new Error('Expected stars for both Alice and Bob in team galaxy payload');
  }

  if (aliceStar.color === bobStar.color) {
    throw new Error(`Expected distinct chromatic colors for different authors, both got ${aliceStar.color}`);
  }

  console.log(`   ✓ Distinct author colors verified!`);
  console.log(`     Alice: ${aliceStar.color}`);
  console.log(`     Bob:   ${bobStar.color}`);

  // 7. Cleanup
  console.log('\n7. Cleaning up test records...');
  await db.delete(teams).where(eq(teams.id, team.id));
  await db.delete(users).where(eq(users.githubId, aliceGithubId));
  await db.delete(users).where(eq(users.githubId, bobGithubId));
  console.log('   ✓ Cleaned up test team and users.\n');

  console.log('🎉 ALL TEAMS & MULTI-AUTHOR STAR SYSTEM TESTS PASSED PERFECTLY!');
  process.exit(0);
}

runTeamTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
