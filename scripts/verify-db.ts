import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db, users, projects, commits, streaks } from '../db';
import { eq, sql } from 'drizzle-orm';

async function verify() {
  console.log('=== CommitCosmos Database Verification Script ===\n');

  // 1. Insert test user
  console.log('1. Creating test user: "hackathon-cosmonaut"...');
  const [testUser] = await db
    .insert(users)
    .values({
      githubId: 99999901,
      githubUsername: 'hackathon-cosmonaut',
      avatarUrl: 'https://avatars.githubusercontent.com/u/99999901',
    })
    .returning();

  console.log(`   ✓ Created User ID: ${testUser.id}`);

  // 2. Insert test project
  console.log('2. Creating test project: "commit-cosmos-demo"...');
  const [testProject] = await db
    .insert(projects)
    .values({
      userId: testUser.id,
      repoUrl: 'https://github.com/hackathon-cosmonaut/commit-cosmos-demo',
      repoName: 'commit-cosmos-demo',
    })
    .returning();

  console.log(`   ✓ Created Project ID: ${testProject.id}`);

  // 3. Insert Commit 1 on Day 1 (2026-09-01)
  console.log('3. Inserting Commit 1 on Day 1 (2026-09-01T12:00:00Z)...');
  await db.insert(commits).values({
    projectId: testProject.id,
    sha: '1a2b3c4d5e6f0001',
    message: 'feat: ignition of galaxy star map',
    language: 'TypeScript',
    committedAt: new Date('2026-09-01T12:00:00Z'),
  });

  const [streakDay1] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, testUser.id));

  console.log(`   ✓ Trigger fired! Current Streak: ${streakDay1?.currentStreak}, Longest: ${streakDay1?.longestStreak}, Last Active: ${streakDay1?.lastActiveDate}`);

  // 4. Insert Commit 2 on Day 2 (2026-09-02, exactly 1 day after)
  console.log('4. Inserting Commit 2 on Day 2 (2026-09-02T15:30:00Z)...');
  await db.insert(commits).values({
    projectId: testProject.id,
    sha: '1a2b3c4d5e6f0002',
    message: 'feat: connect constellation lines',
    language: 'TypeScript',
    committedAt: new Date('2026-09-02T15:30:00Z'),
  });

  const [streakDay2] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, testUser.id));

  console.log(`   ✓ Trigger fired! Current Streak: ${streakDay2?.currentStreak}, Longest: ${streakDay2?.longestStreak}, Last Active: ${streakDay2?.lastActiveDate}`);

  if (streakDay2?.currentStreak !== 2) {
    throw new Error(`Expected current_streak to be 2, but received ${streakDay2?.currentStreak}`);
  }

  // 5. Query user_stats_view
  console.log('5. Querying user_stats_view for aggregates...');
  const statsResult = await db.execute(
    sql`SELECT * FROM user_stats_view WHERE user_id = ${testUser.id}`
  );

  console.log('   ✓ user_stats_view record:', statsResult.rows[0]);

  const stats = statsResult.rows[0] as {
    user_id: string;
    github_username: string;
    total_commits: number;
    total_projects: number;
    current_streak: number;
    longest_streak: number;
  };

  if (
    Number(stats.total_commits) !== 2 ||
    Number(stats.total_projects) !== 1 ||
    Number(stats.current_streak) !== 2 ||
    Number(stats.longest_streak) !== 2
  ) {
    throw new Error(
      `Aggregates mismatch in user_stats_view! Received: ${JSON.stringify(stats)}`
    );
  }

  // 6. Cleanup test data
  console.log('6. Cleaning up test data (cascade delete from users)...');
  await db.delete(users).where(eq(users.id, testUser.id));

  // Verify cleanup
  const remainingUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, testUser.id));
  const remainingCommits = await db
    .select()
    .from(commits)
    .where(eq(commits.projectId, testProject.id));
  const remainingStreaks = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, testUser.id));

  console.log(`   ✓ Cleaned up test data. Remaining rows: users=${remainingUsers.length}, commits=${remainingCommits.length}, streaks=${remainingStreaks.length}`);

  console.log('\n=== All Verifications Passed Successfully! ===');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
