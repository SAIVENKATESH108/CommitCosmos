import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '../db';
import { users, projects, commits, branches, releases, closedIssues, teams, teamMembers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { POST as webhookPOST } from '../app/api/webhooks/github/route';
import { GET as galaxyGET } from '../app/api/galaxy/[username]/route';
import { GET as statsGET } from '../app/api/stats/[username]/route';
import { GET as teamGalaxyGET } from '../app/api/teams/[teamId]/galaxy/route';

function createHmacSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

async function runMasterJudgeRegression() {
  console.log('======================================================================');
  console.log('🌌 CommitCosmos: Phase 2 Master Judge Simulation & Regression Suite');
  console.log('======================================================================\n');

  const testGithubId = 88877711;
  const testUsername = 'phase2-judge-sim';
  const repoName = 'quantum-stellar-engine';
  const secret = process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  const results: { step: string; status: 'PASS' | 'FAIL'; note: string }[] = [];

  let testUserId = '';
  let testProjectId = '';

  try {
    // --------------------------------------------------------------------------
    // 1. User Sign-In & Profile Ingestion
    // --------------------------------------------------------------------------
    console.log('Step 1: Simulating NextAuth GitHub Authentication...');
    await db.delete(users).where(eq(users.githubId, testGithubId));

    const [testUser] = await db
      .insert(users)
      .values({
        githubId: testGithubId,
        githubUsername: testUsername,
        avatarUrl: 'https://avatars.githubusercontent.com/u/88877711?v=4',
      })
      .returning();

    testUserId = testUser.id;
    console.log(`  ✓ User authenticated: @${testUser.githubUsername} (${testUser.id})`);
    results.push({
      step: '1. User Sign-In & Profile Ingestion',
      status: 'PASS',
      note: `Upserted user @${testUsername} in database with OAuth GitHub ID ${testGithubId}.`,
    });

    // --------------------------------------------------------------------------
    // 2. Initial Empty State Verification
    // --------------------------------------------------------------------------
    console.log('\nStep 2: Verifying Dormant Protostar Empty State (0 commits)...');
    const emptyReq = new NextRequest(`http://localhost:3000/api/galaxy/${testUsername}`);
    const emptyRes = await galaxyGET(emptyReq, { params: { username: testUsername } });
    const emptyData = await emptyRes.json();

    if (emptyRes.status === 200 && emptyData.totalStars === 0 && emptyData.commits.length === 0) {
      console.log('  ✓ Empty state verified: returns totalStars=0, rendering ProtostarCore');
      results.push({
        step: '2. Empty State Handling (Protostar Core)',
        status: 'PASS',
        note: 'Returns valid empty schema with totalStars=0, activating embryonic ProtostarCore.',
      });
    } else {
      throw new Error(`Unexpected empty state response: ${JSON.stringify(emptyData)}`);
    }

    // --------------------------------------------------------------------------
    // 3. Connect Repo & Direct Push Webhook (Default Branch)
    // --------------------------------------------------------------------------
    console.log('\nStep 3: Ingesting Initial Direct Push on main via GitHub Webhook...');
    const push1Payload = JSON.stringify({
      ref: 'refs/heads/main',
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      commits: [
        {
          id: 'sha-main-001',
          message: 'feat(core): initialize plasma reactor core',
          timestamp: '2026-09-14T10:00:00Z',
          added: ['reactor.rs', 'plasma.rs'],
          modified: ['Cargo.toml'],
          removed: [],
        },
        {
          id: 'sha-main-002',
          message: 'feat(telemetry): setup andromeda quantum telemetry stream',
          timestamp: '2026-09-15T11:30:00Z',
          added: ['telemetry.ts', 'stream.ts', 'quantum.ts'],
          modified: ['package.json'],
          removed: [],
        },
      ],
      pusher: { name: testUsername },
      sender: { id: testGithubId, login: testUsername },
    });

    const push1Req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'push',
        'x-forwarded-for': '10.99.0.1',
        'x-hub-signature-256': createHmacSignature(push1Payload, secret),
      },
      body: push1Payload,
    });

    const push1Res = await webhookPOST(push1Req);
    const push1Data = await push1Res.json();
    console.log(`  ✓ Webhook push status: ${push1Res.status}`, push1Data);

    if (push1Res.status === 200 && push1Data.inserted === 2) {
      results.push({
        step: '3. Direct Push Ingestion & HMAC Verification',
        status: 'PASS',
        note: 'Ingested 2 initial commits with HMAC-SHA256 signature verification.',
      });
    } else {
      throw new Error(`Direct push ingestion failed: ${JSON.stringify(push1Data)}`);
    }

    // Set languages for spectral color verification
    await db.update(commits).set({ language: 'Rust' }).where(eq(commits.sha, 'sha-main-001'));
    await db.update(commits).set({ language: 'TypeScript' }).where(eq(commits.sha, 'sha-main-002'));

    // --------------------------------------------------------------------------
    // 4. GitHub 'create' Event: Branch Creation (Branch Moon)
    // --------------------------------------------------------------------------
    console.log('\nStep 4: Simulating GitHub "create" Event (Feature Branch)...');
    const createBranchPayload = JSON.stringify({
      ref: 'feature/antimatter-drive',
      ref_type: 'branch',
      master_branch: 'main',
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      sender: { id: testGithubId, login: testUsername },
    });

    const createBranchReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'create',
        'x-forwarded-for': '10.99.0.2',
        'x-hub-signature-256': createHmacSignature(createBranchPayload, secret),
      },
      body: createBranchPayload,
    });

    const createBranchRes = await webhookPOST(createBranchReq);
    const createBranchData = await createBranchRes.json();
    console.log(`  ✓ Webhook create branch status: ${createBranchRes.status}`, createBranchData);

    if (createBranchRes.status === 200 && createBranchData.branch) {
      results.push({
        step: '4. Branch Creation ("create" Event -> Branch Moon)',
        status: 'PASS',
        note: `Created branch "${createBranchData.branch}" mapped to orbiting moon.`,
      });
    } else {
      throw new Error(`Branch creation failed: ${JSON.stringify(createBranchData)}`);
    }

    // Push commit to the feature branch
    const pushBranchPayload = JSON.stringify({
      ref: 'refs/heads/feature/antimatter-drive',
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      commits: [
        {
          id: 'sha-branch-001',
          message: 'feat(antimatter): stabilize magnetic containment field',
          timestamp: '2026-09-15T14:00:00Z',
          added: ['containment.py'],
          modified: [],
          removed: [],
        },
      ],
      pusher: { name: testUsername },
      sender: { id: testGithubId, login: testUsername },
    });

    const pushBranchReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'push',
        'x-forwarded-for': '10.99.0.3',
        'x-hub-signature-256': createHmacSignature(pushBranchPayload, secret),
      },
      body: pushBranchPayload,
    });
    await webhookPOST(pushBranchReq);
    await db.update(commits).set({ language: 'Python' }).where(eq(commits.sha, 'sha-branch-001'));

    // --------------------------------------------------------------------------
    // 5. GitHub 'pull_request' Event: PR Merge (Accretion Binary Star)
    // --------------------------------------------------------------------------
    console.log('\nStep 5: Simulating GitHub "pull_request" Merge Event...');
    const prMergePayload = JSON.stringify({
      action: 'closed',
      pull_request: {
        number: 42,
        title: 'Merge Antimatter Drive into Mainline Reactor',
        merged: true,
        merged_at: '2026-09-16T08:00:00Z',
        merge_commit_sha: 'sha-pr-merge-042',
        head: { ref: 'feature/antimatter-drive' },
        base: { ref: 'main' },
        commits: 1,
      },
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      sender: { id: testGithubId, login: testUsername },
    });

    const prMergeReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'pull_request',
        'x-forwarded-for': '10.99.0.4',
        'x-hub-signature-256': createHmacSignature(prMergePayload, secret),
      },
      body: prMergePayload,
    });

    const prMergeRes = await webhookPOST(prMergeReq);
    const prMergeData = await prMergeRes.json();
    console.log(`  ✓ Webhook PR merge status: ${prMergeRes.status}`, prMergeData);

    if (prMergeRes.status === 200 && prMergeData.prNumber === 42) {
      results.push({
        step: '5. PR Merge ("pull_request" Event -> Accretion Star)',
        status: 'PASS',
        note: 'Marked PR #42 merge with isPrMerge=true and initiated branch moon collapse.',
      });
    } else {
      throw new Error(`PR merge handling failed: ${JSON.stringify(prMergeData)}`);
    }

    // --------------------------------------------------------------------------
    // 6. GitHub 'release' Event: Tagged Release Supernova Celebration
    // --------------------------------------------------------------------------
    console.log('\nStep 6: Simulating GitHub "release" Published Event...');
    const releasePayload = JSON.stringify({
      action: 'published',
      release: {
        id: 771122,
        tag_name: 'v1.0.0-stellar',
        name: 'Stellar Ignition Milestone v1.0.0',
        published_at: '2026-09-16T09:00:00Z',
        draft: false,
        prerelease: false,
      },
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      sender: { id: testGithubId, login: testUsername },
    });

    const releaseReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'release',
        'x-forwarded-for': '10.99.0.5',
        'x-hub-signature-256': createHmacSignature(releasePayload, secret),
      },
      body: releasePayload,
    });

    const releaseRes = await webhookPOST(releaseReq);
    const releaseData = await releaseRes.json();
    console.log(`  ✓ Webhook release status: ${releaseRes.status}`, releaseData);

    if (releaseRes.status === 200 && releaseData.tagName === 'v1.0.0-stellar') {
      results.push({
        step: '6. Tagged Release ("release" Event -> Supernova & Halo)',
        status: 'PASS',
        note: 'Recorded release v1.0.0-stellar, triggering shockwave and permanent ClusterReleaseHalo.',
      });
    } else {
      throw new Error(`Release handling failed: ${JSON.stringify(releaseData)}`);
    }

    // --------------------------------------------------------------------------
    // 7. GitHub 'issues' Event: Issue Closure Shooting Star
    // --------------------------------------------------------------------------
    console.log('\nStep 7: Simulating GitHub "issues" Closed Event...');
    const issuePayload = JSON.stringify({
      action: 'closed',
      issue: {
        id: 554433,
        number: 88,
        title: 'Fix sub-light navigation anomaly',
        closed_at: '2026-09-16T09:30:00Z',
      },
      repository: {
        name: repoName,
        full_name: `${testUsername}/${repoName}`,
        html_url: `https://github.com/${testUsername}/${repoName}`,
        owner: { id: testGithubId, login: testUsername },
      },
      sender: { id: testGithubId, login: testUsername },
    });

    const issueReq = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'issues',
        'x-forwarded-for': '10.99.0.7',
        'x-hub-signature-256': createHmacSignature(issuePayload, secret),
      },
      body: issuePayload,
    });

    const issueRes = await webhookPOST(issueReq);
    const issueData = await issueRes.json();
    console.log(`  ✓ Webhook issue status: ${issueRes.status}`, issueData);

    if (issueRes.status === 200 && issueData.issueNumber === 88) {
      results.push({
        step: '7. Issue Closure ("issues" Event -> Shooting Star)',
        status: 'PASS',
        note: 'Persisted closed issue #88, triggering transient shooting star trajectory.',
      });
    } else {
      throw new Error(`Issue closure handling failed: ${JSON.stringify(issueData)}`);
    }

    // --------------------------------------------------------------------------
    // 8. Galaxy API Output Verification
    // --------------------------------------------------------------------------
    console.log('\nStep 8: Verifying Full Galaxy API Data Contract...');
    const galaxyReq = new NextRequest(`http://localhost:3000/api/galaxy/${testUsername}`);
    const galaxyRes = await galaxyGET(galaxyReq, { params: { username: testUsername } });
    const galaxyData = await galaxyRes.json();

    console.log(`  ✓ Total stars: ${galaxyData.totalStars}`);
    console.log(`  ✓ Total projects: ${galaxyData.projects.length}`);
    console.log(`  ✓ Total branches: ${galaxyData.branches?.length}`);
    console.log(`  ✓ Total releases: ${galaxyData.releases?.length}`);
    console.log(`  ✓ Total closed issues: ${galaxyData.closedIssues?.length}`);

    const prMergeCommit = galaxyData.commits.find((c: any) => c.isPrMerge === true);
    const hasReleases = galaxyData.releases && galaxyData.releases.length > 0;
    const hasBranches = galaxyData.branches && galaxyData.branches.length > 0;
    const hasClosedIssues = galaxyData.closedIssues && galaxyData.closedIssues.length > 0;

    if (prMergeCommit && hasReleases && hasBranches && hasClosedIssues && galaxyData.totalStars >= 3) {
      results.push({
        step: '8. Galaxy API Contract & Primitives Parity',
        status: 'PASS',
        note: 'All Phase 2 primitives (PR merge star, branches, releases, closed issues) populated in API.',
      });
    } else {
      throw new Error(`Galaxy API contract incomplete: ${JSON.stringify(galaxyData)}`);
    }

    // --------------------------------------------------------------------------
    // 9. Stats & Accessible 2D List View Data Parity
    // --------------------------------------------------------------------------
    console.log('\nStep 9: Verifying Accessible List View Stats Parity...');
    const statsReq = new NextRequest(`http://localhost:3000/api/stats/${testUsername}`);
    const statsRes = await statsGET(statsReq, { params: { username: testUsername } });
    const statsData = await statsRes.json();

    console.log(`  ✓ Stats: commits=${statsData.totalCommits}, projects=${statsData.totalProjects}, streak=${statsData.currentStreak}`);

    if (statsData.totalCommits === galaxyData.totalStars && statsData.totalProjects === galaxyData.projects.length) {
      results.push({
        step: '9. 3D and 2D List View Parity',
        status: 'PASS',
        note: `Exact metric parity: ${statsData.totalCommits} stars across ${statsData.totalProjects} repos in both views.`,
      });
    } else {
      throw new Error(`Stats parity failure: stats=${statsData.totalCommits}, galaxy=${galaxyData.totalStars}`);
    }

    // --------------------------------------------------------------------------
    // 10. Multi-Author Team Star System Verification
    // --------------------------------------------------------------------------
    console.log('\nStep 10: Verifying Teams Multi-Author Star System...');
    const uniqueInviteCode = `TEAM-HYPERION-${Date.now()}`;
    await db.delete(users).where(eq(users.githubId, 88877722));

    const [team] = await db
      .insert(teams)
      .values({
        name: 'Hyperion Cosmic Squadron',
        inviteCode: uniqueInviteCode,
        createdBy: testUserId,
      })
      .returning();

    // Add creator as owner
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: testUserId,
      role: 'owner',
    });

    // Create collaborator user
    const [collabUser] = await db
      .insert(users)
      .values({
        githubId: 88877722,
        githubUsername: 'cosmo-navigator',
        avatarUrl: 'https://avatars.githubusercontent.com/u/88877722?v=4',
      })
      .returning();

    // Add collaborator to team
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: collabUser.id,
      role: 'member',
    });

    // Associate project with team
    const [dbProj] = await db.select().from(projects).where(eq(projects.repoName, repoName));
    if (dbProj) {
      await db.update(projects).set({ teamId: team.id }).where(eq(projects.id, dbProj.id));
      testProjectId = dbProj.id;
    }

    // Ingest commit from collaborator
    await db.insert(commits).values({
      projectId: testProjectId,
      authorUsername: collabUser.githubUsername,
      sha: 'sha-collab-001',
      message: 'feat(nav): plot course through Orion cluster',
      committedAt: new Date(),
      magnitude: 45,
      language: 'Go',
    });

    const teamGalaxyReq = new NextRequest(`http://localhost:3000/api/teams/${team.id}/galaxy`);
    const teamGalaxyRes = await teamGalaxyGET(teamGalaxyReq, { params: { teamId: team.id } });
    const teamGalaxyData = await teamGalaxyRes.json();

    console.log(`  ✓ Team Galaxy status: ${teamGalaxyRes.status}`);
    console.log(`  ✓ Team Members: ${teamGalaxyData.members.length}`);
    console.log(`  ✓ Team Total Stars: ${teamGalaxyData.totalStars}`);

    const hasDistinctAuthors = teamGalaxyData.commits.some((c: any) => c.authorUsername === 'cosmo-navigator') &&
                               teamGalaxyData.commits.some((c: any) => c.authorUsername === testUsername);

    if (teamGalaxyRes.status === 200 && teamGalaxyData.members.length === 2 && hasDistinctAuthors) {
      results.push({
        step: '10. Multi-Author Team Star System',
        status: 'PASS',
        note: 'Multi-author commits mapped with chromatic author colors in shared planetary system.',
      });
    } else {
      throw new Error(`Team galaxy verification failed: ${JSON.stringify(teamGalaxyData)}`);
    }

    // --------------------------------------------------------------------------
    // Cleanup
    // --------------------------------------------------------------------------
    console.log('\nCleaning up verification records...');
    await db.delete(teams).where(eq(teams.id, team.id));
    await db.delete(users).where(eq(users.id, collabUser.id));
    await db.delete(users).where(eq(users.id, testUserId));
    console.log('✓ Cleaned up all test entities cleanly.');

  } catch (err) {
    console.error('Master regression failed with error:', err);
    results.push({
      step: 'Master Regression Execution',
      status: 'FAIL',
      note: String(err),
    });
  }

  console.log('\n======================================================================');
  console.log('📋 Master Judge Regression Summary Report');
  console.log('======================================================================');
  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.step}`);
    console.log(`   └─ ${r.note}`);
  });

  const allPassed = results.every((r) => r.status === 'PASS');
  if (allPassed && results.length === 10) {
    console.log('\n🎉 ALL 10 MASTER JUDGE REGRESSION CHECKS PASSED WITH ZERO FAILURES!');
    process.exit(0);
  } else {
    console.error('\n❌ REGRESSION DETECTED IN MASTER SUITE');
    process.exit(1);
  }
}

runMasterJudgeRegression().catch((err) => {
  console.error('Fatal error during master regression:', err);
  process.exit(1);
});
