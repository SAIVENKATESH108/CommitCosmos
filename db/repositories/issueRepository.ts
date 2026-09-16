import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { closedIssues, projects, type ClosedIssue, type NewClosedIssue } from '../schema';

/**
 * ==============================================================================
 * Issue Repository
 * ==============================================================================
 * Records and fetches closed GitHub issues to drive celebratory in-the-moment
 * shooting star visual animations in the 3D celestial sky.
 * ==============================================================================
 */

/**
 * Idempotently records an issue closure event for a project.
 * If the issue closure has already been recorded, returns the existing record.
 */
export async function recordClosedIssue(
  projectId: string,
  issueNumber: number,
  issueTitle: string | null = null,
  closingCommitSha: string | null = null,
  closingPrNumber: number | null = null,
  closedAt: Date = new Date()
): Promise<ClosedIssue> {
  const [existing] = await db
    .select()
    .from(closedIssues)
    .where(and(eq(closedIssues.projectId, projectId), eq(closedIssues.issueNumber, issueNumber)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(closedIssues)
    .values({
      projectId,
      issueNumber,
      issueTitle: issueTitle ?? null,
      closingCommitSha: closingCommitSha ?? null,
      closingPrNumber: closingPrNumber ?? null,
      closedAt,
    })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    const [fallback] = await db
      .select()
      .from(closedIssues)
      .where(and(eq(closedIssues.projectId, projectId), eq(closedIssues.issueNumber, issueNumber)))
      .limit(1);
    return fallback;
  }

  return inserted;
}

/**
 * Fetches recent closed issues for all projects belonging to a user.
 */
export async function getClosedIssuesForUser(userId: string, limit = 20): Promise<ClosedIssue[]> {
  const rows = await db
    .select({
      id: closedIssues.id,
      projectId: closedIssues.projectId,
      issueNumber: closedIssues.issueNumber,
      issueTitle: closedIssues.issueTitle,
      closingCommitSha: closedIssues.closingCommitSha,
      closingPrNumber: closedIssues.closingPrNumber,
      closedAt: closedIssues.closedAt,
    })
    .from(closedIssues)
    .innerJoin(projects, eq(closedIssues.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(closedIssues.closedAt))
    .limit(limit);

  return rows;
}
