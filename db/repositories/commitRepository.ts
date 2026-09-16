import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { commits, projects, type Commit } from '../schema';

/**
 * Inserts a commit for a project, or updates isPrMerge/prNumber if it was previously inserted.
 */
export async function insertCommit(
  projectId: string,
  sha: string,
  message?: string | null,
  language?: string | null,
  committedAt: Date = new Date(),
  magnitude?: number | null,
  branchId?: string | null,
  isPrMerge: boolean = false,
  prNumber?: number | null,
  authorUsername?: string | null,
  authorAvatarUrl?: string | null
): Promise<Commit | null> {
  const [inserted] = await db
    .insert(commits)
    .values({
      projectId,
      sha,
      message: message ?? null,
      language: language ?? null,
      committedAt,
      magnitude: magnitude ?? null,
      branchId: branchId ?? null,
      isPrMerge,
      prNumber: prNumber ?? null,
      authorUsername: authorUsername ?? null,
      authorAvatarUrl: authorAvatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: [commits.projectId, commits.sha],
      set: {
        isPrMerge,
        ...(prNumber != null ? { prNumber } : {}),
        ...(authorUsername ? { authorUsername } : {}),
        ...(authorAvatarUrl ? { authorAvatarUrl } : {}),
      },
    })
    .returning();

  return inserted ?? null;
}

/**
 * Marks an existing commit as a PR merge commit.
 */
export async function markCommitAsPrMerge(
  projectId: string,
  sha: string,
  prNumber?: number | null
): Promise<Commit | null> {
  const [updated] = await db
    .update(commits)
    .set({
      isPrMerge: true,
      ...(prNumber != null ? { prNumber } : {}),
    })
    .where(and(eq(commits.projectId, projectId), eq(commits.sha, sha)))
    .returning();

  return updated ?? null;
}

/**
 * Fetches paginated commits for a specific project in reverse-chronological order, leveraging the idx_commits_project_time index.
 */
export async function getCommitsForProject(
  projectId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Commit[]> {
  return db
    .select()
    .from(commits)
    .where(eq(commits.projectId, projectId))
    .orderBy(desc(commits.committedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Fetches all commits across all connected projects for a user to construct their interactive 3D galaxy scene.
 */
export async function getAllCommitsForUser(userId: string): Promise<Commit[]> {
  const rows = await db
    .select({
      id: commits.id,
      projectId: commits.projectId,
      branchId: commits.branchId,
      sha: commits.sha,
      message: commits.message,
      language: commits.language,
      committedAt: commits.committedAt,
      magnitude: commits.magnitude,
      isPrMerge: commits.isPrMerge,
      prNumber: commits.prNumber,
      authorUsername: commits.authorUsername,
      authorAvatarUrl: commits.authorAvatarUrl,
    })
    .from(commits)
    .innerJoin(projects, eq(commits.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(commits.committedAt));

  return rows;
}

/**
 * Fetches all commits across all repositories assigned to a team.
 */
export async function getAllCommitsForTeam(teamId: string): Promise<Commit[]> {
  const rows = await db
    .select({
      id: commits.id,
      projectId: commits.projectId,
      branchId: commits.branchId,
      sha: commits.sha,
      message: commits.message,
      language: commits.language,
      committedAt: commits.committedAt,
      magnitude: commits.magnitude,
      isPrMerge: commits.isPrMerge,
      prNumber: commits.prNumber,
      authorUsername: commits.authorUsername,
      authorAvatarUrl: commits.authorAvatarUrl,
    })
    .from(commits)
    .innerJoin(projects, eq(commits.projectId, projects.id))
    .where(eq(projects.teamId, teamId))
    .orderBy(desc(commits.committedAt));

  return rows;
}
