import { and, eq } from 'drizzle-orm';
import { db } from '../index';
import { branches, projects, type Branch, type NewBranch } from '../schema';

/**
 * Creates a branch if it does not already exist, or updates its default status if needed.
 * Returns the branch record.
 */
export async function createOrGetBranch(
  projectId: string,
  branchName: string,
  isDefault: boolean = false
): Promise<Branch> {
  const [existing] = await db
    .select()
    .from(branches)
    .where(and(eq(branches.projectId, projectId), eq(branches.branchName, branchName)))
    .limit(1);

  if (existing) {
    // If default status has changed (e.g., repo default branch changed)
    if (existing.isDefault !== isDefault) {
      const [updated] = await db
        .update(branches)
        .set({ isDefault })
        .where(eq(branches.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [inserted] = await db
    .insert(branches)
    .values({
      projectId,
      branchName,
      isDefault,
    })
    .onConflictDoUpdate({
      target: [branches.projectId, branches.branchName],
      set: { isDefault },
    })
    .returning();

  return inserted;
}

/**
 * Marks a branch as merged / deleted by setting merged_at.
 */
export async function markBranchMerged(
  projectId: string,
  branchName: string,
  mergedAt: Date = new Date()
): Promise<Branch | null> {
  const [updated] = await db
    .update(branches)
    .set({ mergedAt })
    .where(and(eq(branches.projectId, projectId), eq(branches.branchName, branchName)))
    .returning();

  return updated ?? null;
}

/**
 * Fetches all branches for a given project.
 */
export async function getBranchesForProject(projectId: string): Promise<Branch[]> {
  return db
    .select()
    .from(branches)
    .where(eq(branches.projectId, projectId));
}

/**
 * Fetches all branches across all connected projects for a user.
 */
export async function getBranchesForUser(userId: string): Promise<Branch[]> {
  return db
    .select({
      id: branches.id,
      projectId: branches.projectId,
      branchName: branches.branchName,
      isDefault: branches.isDefault,
      createdAt: branches.createdAt,
      mergedAt: branches.mergedAt,
    })
    .from(branches)
    .innerJoin(projects, eq(branches.projectId, projects.id))
    .where(eq(projects.userId, userId));
}
