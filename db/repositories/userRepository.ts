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
 * Fetches a user record by their GitHub numeric ID, returning null if not found.
 */
export async function getUserByGithubId(
  githubId: number
): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubId, githubId))
    .limit(1);

  return user ?? null;
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

export interface LeaderboardEntry extends UserStats {
  avatarUrl?: string | null;
  rank: number;
}

/**
 * Returns the top-N users sorted by either current_streak or total_commits.
 * Joins user_stats_view with users table to include avatar URLs.
 */
export async function getLeaderboard(
  limit = 20,
  sortBy: 'streak' | 'stars' = 'streak'
): Promise<LeaderboardEntry[]> {
  const orderCol = sortBy === 'streak' ? 'current_streak' : 'total_commits';

  const result = await db.execute(
    sql`SELECT v.user_id, v.github_username, v.total_commits, v.total_projects,
               v.current_streak, v.longest_streak, u.avatar_url
        FROM user_stats_view v
        JOIN users u ON u.id = v.user_id
        WHERE v.total_commits > 0
        ORDER BY v.${sql.raw(orderCol)} DESC, v.total_commits DESC
        LIMIT ${limit}`
  );

  return (result.rows as Array<{
    user_id: string;
    github_username: string;
    total_commits: number | string;
    total_projects: number | string;
    current_streak: number | string;
    longest_streak: number | string;
    avatar_url: string | null;
  }>).map((row, i) => ({
    rank: i + 1,
    userId: String(row.user_id),
    githubUsername: String(row.github_username),
    totalCommits: Number(row.total_commits),
    totalProjects: Number(row.total_projects),
    currentStreak: Number(row.current_streak),
    longestStreak: Number(row.longest_streak),
    avatarUrl: row.avatar_url,
  }));
}

/**
 * Returns a list of public galaxies for the explore/gallery page.
 */
export async function getPublicGalaxies(
  limit = 24
): Promise<LeaderboardEntry[]> {
  return getLeaderboard(limit, 'stars');
}

