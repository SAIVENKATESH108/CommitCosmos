import { db } from '../db';
import { commits, users, projects, streaks, constellations } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

async function main() {
  const [user] = await db.select().from(users).where(eq(users.githubUsername, 'SAIVENKATESH108'));
  console.log('User:', user?.id, user?.githubUsername);
  if (!user) return;

  const userStreak = await db.select().from(streaks).where(eq(streaks.userId, user.id));
  console.log('User streak:', userStreak);

  const userConstellations = await db.select().from(constellations).where(eq(constellations.userId, user.id));
  console.log('User constellations:', userConstellations);

  const userCommits = await db.select().from(commits).orderBy(asc(commits.committedAt));
  console.log(`Total commits in DB: ${userCommits.length}`);
  userCommits.forEach((c) => {
    console.log(`- ${c.sha.slice(0, 7)}: ${c.committedAt.toISOString()} | ${c.message?.slice(0, 40)}`);
  });
}

main().catch(console.error);
