/**
 * ==============================================================================
 * Architectural Decision: Server State (TanStack Query) vs. UI State (Zustand)
 * ==============================================================================
 * Server state represents data stored remotely in Neon Postgres that is asynchronous,
 * shared, and subject to out-of-band changes (e.g., new GitHub webhook commits).
 *
 * Storing server state in client-side stores like Zustand or Redux forces developers
 * to manually write loading states, error boundaries, request deduplication, cache
 * invalidation triggers, and polling loops.
 *
 * TanStack Query handles these challenges declaratively:
 * 1. Automatic Deduping: Multiple components rendering the galaxy scene and profile
 *    can request the same data simultaneously without triggering redundant HTTP requests.
 * 2. Smart Polling: Configured via `refetchInterval` to provide near real-time updates
 *    (e.g., lighting new stars as webhooks land) without the architectural overhead
 *    of stateful WebSocket servers.
 * 3. Stale-While-Revalidate: The UI renders instantly from client cache while fetching
 *    fresh celestial data in the background.
 * ==============================================================================
 */

import { useQuery } from '@tanstack/react-query';

export interface GalaxyCommit {
  id: string;
  projectId: string;
  sha: string;
  message: string | null;
  language: string | null;
  committedAt: string;
}

export interface GalaxyProject {
  id: string;
  repoName: string;
  repoUrl: string;
}

export interface GalaxyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface GalaxyConstellation {
  id: string;
  name: string;
  streakLength: number;
  unlockedAt: string;
}

export interface GalaxyData {
  user: {
    id: string;
    githubUsername: string;
    avatarUrl: string | null;
  };
  projects: GalaxyProject[];
  commits: GalaxyCommit[];
  streak: GalaxyStreak | null;
  constellations: GalaxyConstellation[];
  totalStars: number;
}

export interface UserStatsData {
  userId: string;
  githubUsername: string;
  totalCommits: number;
  totalProjects: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Fetches the interactive 3D galaxy data for a given GitHub username.
 * Configured with a 20-second polling interval so the galaxy dynamically lights up
 * with new stars as GitHub webhook events arrive, without requiring WebSockets.
 */
export function useGalaxyData(username: string | undefined | null) {
  return useQuery<GalaxyData, Error>({
    queryKey: ['galaxy', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required to fetch galaxy data');
      }

      const response = await fetch(`/api/galaxy/${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch galaxy data (status: ${response.status})`
        );
      }

      return response.json();
    },
    enabled: Boolean(username),
    // Poll every 20 seconds for pseudo-realtime star ignition
    refetchInterval: 20000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });
}

/**
 * Fetches pre-aggregated statistics from the user_stats_view for a user.
 * Polls at a conservative 60-second interval since profile aggregates change less frequently.
 */
export function useUserStats(username: string | undefined | null) {
  return useQuery<UserStatsData, Error>({
    queryKey: ['user-stats', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required to fetch user stats');
      }

      const response = await fetch(`/api/stats/${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch user stats (status: ${response.status})`
        );
      }

      return response.json();
    },
    enabled: Boolean(username),
    // Poll every 60 seconds for aggregate dashboard metrics
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });
}
