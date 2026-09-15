import { eq } from 'drizzle-orm';
import { db } from '../index';
import { streaks, type Streak } from '../schema';

/**
 * Retrieves the current streak progress and longest streak records for a user.
 */
export async function getStreakForUser(
  userId: string
): Promise<Streak | null> {
  const [userStreak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);

  return userStreak ?? null;
}
