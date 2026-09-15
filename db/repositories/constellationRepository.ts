import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { constellations, type Constellation } from '../schema';

/**
 * Retrieves all unlocked constellations achieved by a user, ordered by streak length.
 */
export async function getConstellationsForUser(
  userId: string
): Promise<Constellation[]> {
  return db
    .select()
    .from(constellations)
    .where(eq(constellations.userId, userId))
    .orderBy(desc(constellations.streakLength));
}

/**
 * Unlocks a constellation for a user at a given streak milestone idempotently, returning the existing row if already unlocked.
 */
export async function unlockConstellation(
  userId: string,
  name: string,
  streakLength: number
): Promise<Constellation> {
  // Check if a constellation for this user at this milestone already exists
  const [existing] = await db
    .select()
    .from(constellations)
    .where(
      and(
        eq(constellations.userId, userId),
        eq(constellations.streakLength, streakLength)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  // Insert new milestone unlock
  const [inserted] = await db
    .insert(constellations)
    .values({
      userId,
      name,
      streakLength,
    })
    .returning();

  return inserted;
}
