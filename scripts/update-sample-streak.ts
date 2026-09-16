import { db } from '../db';
import { commits, streaks, users, constellations } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

async function updateStreakData() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubUsername, 'SAIVENKATESH108'));
  if (!user) {
    console.log('User not found');
    return;
  }

  const userCommits = await db
    .select()
    .from(commits)
    .orderBy(asc(commits.committedAt));

  console.log(`Updating ${userCommits.length} commits across consecutive days for @SAIVENKATESH108...`);

  // Distribute across 5 consecutive days: Sep 12, 13, 14, 15, 16
  // Days:
  // c0: 2026-09-12T10:00:00Z (Day 1)
  // c1: 2026-09-13T11:00:00Z (Day 2)
  // c2: 2026-09-13T16:00:00Z (Day 2 second commit)
  // c3: 2026-09-14T09:30:00Z (Day 3)
  // c4: 2026-09-15T14:00:00Z (Day 4)
  // c5: 2026-09-16T08:00:00Z (Day 5)
  // c6: 2026-09-16T11:30:00Z (Day 5 second commit)
  const dateMap: string[] = [
    '2026-09-12T10:00:00Z',
    '2026-09-13T11:00:00Z',
    '2026-09-13T16:00:00Z',
    '2026-09-14T09:30:00Z',
    '2026-09-15T14:00:00Z',
    '2026-09-16T08:00:00Z',
    '2026-09-16T11:30:00Z',
  ];

  for (let i = 0; i < userCommits.length; i++) {
    const targetDate = new Date(dateMap[i] || '2026-09-16T12:00:00Z');
    await db
      .update(commits)
      .set({ committedAt: targetDate })
      .where(eq(commits.id, userCommits[i].id));
  }

  // Update streak record to 5 days
  await db
    .update(streaks)
    .set({
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: '2026-09-16',
    })
    .where(eq(streaks.userId, user.id));

  console.log('Successfully updated commits and streak to 5 consecutive days!');
}

updateStreakData().catch(console.error);
