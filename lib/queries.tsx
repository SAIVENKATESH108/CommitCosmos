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

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getStarColorForLanguage } from './starColors';

export interface GalaxyBranch {
  id: string;
  projectId: string;
  branchName: string;
  isDefault: boolean;
  createdAt: string;
  mergedAt: string | null;
}

export interface GalaxyCommit {
  id: string;
  projectId: string;
  branchId?: string | null;
  sha: string;
  message: string | null;
  language: string | null;
  committedAt: string;
  magnitude?: number | null;
  isPrMerge?: boolean;
  prNumber?: number | null;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  authorColor?: string | null;
}

export interface TeamMemberData {
  userId: string;
  githubUsername: string;
  avatarUrl: string | null;
  role: string;
  color: string;
}

export interface TeamGalaxyData {
  team: {
    id: string;
    name: string;
    inviteCode?: string | null;
  };
  members: TeamMemberData[];
  projects: GalaxyProject[];
  commits: GalaxyCommit[];
  branches?: GalaxyBranch[];
  releases?: GalaxyRelease[];
  totalStars: number;
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

export interface GalaxyRelease {
  id: string;
  projectId: string;
  tagName: string;
  releaseName: string | null;
  releasedAt: string;
  unlockedAt: string;
}

export interface GalaxyClosedIssue {
  id: string;
  projectId: string;
  issueNumber: number;
  issueTitle: string | null;
  closingCommitSha?: string | null;
  closingPrNumber?: number | null;
  closedAt: string;
}

export interface GalaxyData {
  user: {
    id: string;
    githubUsername: string;
    avatarUrl: string | null;
  };
  projects: GalaxyProject[];
  branches?: GalaxyBranch[];
  releases?: GalaxyRelease[];
  closedIssues?: GalaxyClosedIssue[];
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
  const previousStarIdsRef = useRef<Set<string> | null>(null);
  const previousReleaseIdsRef = useRef<Set<string> | null>(null);
  const previousClosedIssueIdsRef = useRef<Set<string> | null>(null);

  const query = useQuery<GalaxyData, Error>({
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

  // Detect newly arrived releases across poll cycles and trigger celebratory supernova toast
  useEffect(() => {
    if (!query.data?.releases) return;

    const currentReleases = query.data.releases;
    const currentIds = new Set(currentReleases.map((r) => r.id));

    if (previousReleaseIdsRef.current === null) {
      previousReleaseIdsRef.current = currentIds;
      return;
    }

    const newReleases = currentReleases.filter((r) => !previousReleaseIdsRef.current!.has(r.id));
    if (newReleases.length > 0) {
      previousReleaseIdsRef.current = currentIds;

      newReleases.forEach((rel) => {
        const project = query.data.projects?.find((p) => p.id === rel.projectId);
        const repoName = project?.repoName ?? 'repository';

        toast(
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 bg-amber-400 animate-ping shadow-[0_0_12px_#fbbf24]"
              aria-hidden="true"
            />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">🌟 Supernova Milestone!</span>
              <span className="text-slate-300">
                {' '}
                Release <strong className="text-white font-mono">{rel.tagName}</strong> published in {repoName}
              </span>
            </div>
          </div>,
          { duration: 6000 }
        );
      });
    }
  }, [query.data]);

  // Detect newly closed issues across poll cycles and trigger celebratory shooting star toast
  useEffect(() => {
    if (!query.data?.closedIssues) return;

    const currentClosed = query.data.closedIssues;
    const currentIds = new Set(currentClosed.map((i) => i.id));

    if (previousClosedIssueIdsRef.current === null) {
      previousClosedIssueIdsRef.current = currentIds;
      return;
    }

    const isTabActive = typeof document !== 'undefined' && document.visibilityState === 'visible';
    const newClosed = currentClosed.filter((i) => !previousClosedIssueIdsRef.current!.has(i.id));
    previousClosedIssueIdsRef.current = currentIds;

    if (newClosed.length > 0 && isTabActive) {
      newClosed.forEach((issue) => {
        const project = query.data.projects?.find((p) => p.id === issue.projectId);
        const repoName = project?.repoName ?? 'repository';

        toast(
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-cyan-400 animate-ping shadow-[0_0_10px_#38bdf8]"
              aria-hidden="true"
            />
            <div className="text-xs">
              <span className="font-semibold text-cyan-300">🌠 Shooting star sighted!</span>
              <span className="text-slate-300">
                {' '}
                Issue <strong className="text-white font-mono">#{issue.issueNumber}</strong> resolved in {repoName}
              </span>
            </div>
          </div>,
          { duration: 4500 }
        );
      });
    }
  }, [query.data]);

  // Detect newly arrived stars across poll cycles and announce them non-disruptively
  useEffect(() => {
    if (!query.data) return;

    const currentCommits = query.data.commits || [];
    const currentIds = new Set(currentCommits.map((c) => c.id));

    // First load: seed cache with existing commit IDs so historical stars don't fire toasts
    if (previousStarIdsRef.current === null) {
      previousStarIdsRef.current = currentIds;
      return;
    }

    // Identify stars not present in the previous poll cycle
    const newCommits = currentCommits.filter(
      (c) => !previousStarIdsRef.current!.has(c.id)
    );

    if (newCommits.length > 0) {
      previousStarIdsRef.current = currentIds;

      if (newCommits.length === 1) {
        const commit = newCommits[0];
        const color = getStarColorForLanguage(commit.language);
        const rawMsg = commit.message?.trim() || 'New commit';
        const truncatedMessage =
          rawMsg.length > 42 ? rawMsg.slice(0, 42).trimEnd() + '…' : rawMsg;

        toast(
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
              aria-hidden="true"
            />
            <div className="text-xs">
              <span className="font-semibold text-white">New star ignited</span>
              <span className="text-slate-400"> — {truncatedMessage}</span>
            </div>
          </div>,
          {
            duration: 4000,
          }
        );
      } else {
        // Multiple new commits in the same poll cycle: batch into a single non-spammy toast
        const project = query.data.projects?.find(
          (p) => p.id === newCommits[0].projectId
        );
        const repoName = project?.repoName ?? 'repository';

        toast(
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]"
              aria-hidden="true"
            />
            <div className="text-xs">
              <span className="font-semibold text-white">
                {newCommits.length} new stars ignited
              </span>
              <span className="text-slate-400"> in {repoName}</span>
            </div>
          </div>,
          {
            duration: 4500,
          }
        );
      }
    }
  }, [query.data]);

  return query;
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
