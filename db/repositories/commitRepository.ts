import { desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { commits, projects, type Commit } from '../schema';

/**
 * Inserts a commit for a project, silently ignoring duplicates when GitHub webhook events are redelivered.
 */
export async function insertCommit(
  projectId: string,
  sha: string,
  message?: string | null,
  language?: string | null,
  committedAt: Date = new Date()
): Promise<Commit | null> {
  const [inserted] = await db
    .insert(commits)
    .values({
      projectId,
      sha,
      message: message ?? null,
      language: language ?? null,
      committedAt,
    })
    .onConflictDoNothing()
    .returning();

  return inserted ?? null;
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
      sha: commits.sha,
      message: commits.message,
      language: commits.language,
      committedAt: commits.committedAt,
    })
    .from(commits)
    .innerJoin(projects, eq(commits.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(commits.committedAt));

  return rows;
}
