import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { releases, projects, type Release, type NewRelease } from '../schema';

/**
 * Idempotently records an unlocked release for a project.
 * If a release with the given (projectId, tagName) already exists, returns the existing record.
 */
export async function unlockRelease(
  projectId: string,
  tagName: string,
  releaseName: string | null = null,
  releasedAt: Date = new Date()
): Promise<Release> {
  const [existing] = await db
    .select()
    .from(releases)
    .where(and(eq(releases.projectId, projectId), eq(releases.tagName, tagName)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(releases)
    .values({
      projectId,
      tagName,
      releaseName: releaseName ?? null,
      releasedAt,
    })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    const [fallback] = await db
      .select()
      .from(releases)
      .where(and(eq(releases.projectId, projectId), eq(releases.tagName, tagName)))
      .limit(1);
    return fallback;
  }

  return inserted;
}

/**
 * Fetches all releases for a specific repository ordered by release date descending.
 */
export async function getReleasesForProject(projectId: string): Promise<Release[]> {
  return db
    .select()
    .from(releases)
    .where(eq(releases.projectId, projectId))
    .orderBy(desc(releases.releasedAt));
}

/**
 * Fetches all releases across all connected projects for a user.
 */
export async function getReleasesForUser(userId: string): Promise<Release[]> {
  return db
    .select({
      id: releases.id,
      projectId: releases.projectId,
      tagName: releases.tagName,
      releaseName: releases.releaseName,
      releasedAt: releases.releasedAt,
      unlockedAt: releases.unlockedAt,
    })
    .from(releases)
    .innerJoin(projects, eq(releases.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(releases.releasedAt));
}
