import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { projects, type Project } from '../schema';

/**
 * Inserts a new project for a user or returns the existing project if the repository URL is already connected.
 */
export async function createProject(
  userId: string,
  repoUrl: string,
  repoName: string
): Promise<Project> {
  const [inserted] = await db
    .insert(projects)
    .values({
      userId,
      repoUrl,
      repoName,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return inserted;
  }

  // If already exists under the unique constraint on (user_id, repo_url), fetch and return the existing row
  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.repoUrl, repoUrl)))
    .limit(1);

  if (!existing) {
    throw new Error(`Failed to create or retrieve project for user ${userId} and repo ${repoUrl}`);
  }

  return existing;
}

/**
 * Retrieves all connected GitHub projects belonging to a specific user.
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}
