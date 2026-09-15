import { eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { users, type User, type UserStats } from '../schema';

export interface GitHubProfile {
  githubId: number;
  githubUsername: string;
  avatarUrl?: string | null;
}

/**
 * Upserts a user from a GitHub OAuth profile, updating their username and avatar if already existing.
 */
export async function createOrUpdateUserFromGitHub(
  profile: GitHubProfile
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      githubId: profile.githubId,
      githubUsername: profile.githubUsername,
      avatarUrl: profile.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.githubId,
      set: {
        githubUsername: profile.githubUsername,
        avatarUrl: profile.avatarUrl ?? null,
      },
    })
    .returning();

  return user;
}

/**
 * Fetches a user record by their GitHub username, returning null if not found.
 */
export async function getUserByUsername(
  username: string
): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubUsername, username))
    .limit(1);

  return user ?? null;
}

/**
 * Queries the user_stats_view to retrieve pre-aggregated commit, project, and streak metrics for a user.
 */
export async function getUserStats(
  username: string
): Promise<UserStats | null> {
  const result = await db.execute(
    sql`SELECT user_id, github_username, total_commits, total_projects, current_streak, longest_streak 
        FROM user_stats_view 
        WHERE github_username = ${username} 
        LIMIT 1`
  );

  const row = result.rows[0] as
    | {
        user_id: string;
        github_username: string;
        total_commits: number | string;
        total_projects: number | string;
        current_streak: number | string;
        longest_streak: number | string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    userId: String(row.user_id),
    githubUsername: String(row.github_username),
    totalCommits: Number(row.total_commits),
    totalProjects: Number(row.total_projects),
    currentStreak: Number(row.current_streak),
    longestStreak: Number(row.longest_streak),
  };
}
