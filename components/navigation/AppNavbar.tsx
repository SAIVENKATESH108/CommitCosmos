'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Flame, FolderGit2, Box, ListFilter, LayoutDashboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SignInButton } from '@/components/auth/SignInButton';
import type { GalaxyProject } from '@/lib/queries';

export interface AppNavbarProps {
  /** Optional username of the profile currently being viewed */
  profileUsername?: string;
  /** Optional avatar of the profile being viewed */
  profileAvatarUrl?: string | null;
  /** User object passed from server or session */
  currentUser?: {
    id?: string;
    githubUsername?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
  } | null;
  /** Current streak days */
  currentStreak?: number;
  /** Total commits count */
  totalCommits?: number;
  /** Connected projects list for repo filtering */
  projects?: GalaxyProject[];
  /** Selected repository filter ID ('all' or specific project ID) */
  selectedRepoId?: string;
  /** Callback when repository filter selection changes */
  onSelectRepo?: (repoId: string) => void;
  /** Per-project commit count map */
  repoCommitCounts?: Record<string, number>;
  /** Whether the accessible 2D list view is active */
  isListView?: boolean;
  /** Callback when toggling between 3D Galaxy and 2D List view */
  onToggleListView?: (isList: boolean) => void;
  /** Optional custom title or page badge (e.g. "Observatory") */
  pageBadge?: string;
}

export function AppNavbar({
  profileUsername,
  profileAvatarUrl,
  currentUser: initialUser,
  currentStreak = 0,
  totalCommits = 0,
  projects = [],
  selectedRepoId = 'all',
  onSelectRepo,
  repoCommitCounts = {},
  isListView = false,
  onToggleListView,
  pageBadge,
}: AppNavbarProps) {
  // TanStack / NextAuth client session for reactive updates
  const { data: session } = useSession();

  // Signed-in user resolution: props > session
  const signedInUser = initialUser || session?.user || null;
  const signedInUsername = signedInUser?.githubUsername;
  const signedInAvatar =
    signedInUser?.image ||
    (signedInUser && 'avatarUrl' in signedInUser ? (signedInUser as { avatarUrl?: string | null }).avatarUrl : null) ||
    (profileUsername === signedInUsername ? profileAvatarUrl : null);

  const streakDaysText = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;

  // Find the selected project name for the select trigger display
  const selectedProject = projects.find((p) => p.id === selectedRepoId);
  const selectedRepoLabel =
    selectedRepoId === 'all'
      ? `All repos (${totalCommits})`
      : `${selectedProject?.repoName || 'Selected repo'} (${repoCommitCounts[selectedRepoId] ?? 0})`;

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-black/90 backdrop-blur-xl transition-all"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* ================= LEFT: Brand Logo & Wordmark ================= */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            aria-label="CommitCosmos Homepage"
            className="group flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg p-1"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/40 bg-black shadow-lg shadow-indigo-500/20 shrink-0">
              <Image
                src="/commitcosmos_logo.png"
                alt="CommitCosmos Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg group-hover:text-indigo-300 transition-colors">
                CommitCosmos
              </span>
              {pageBadge && (
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex text-[10px] py-0 px-2 bg-indigo-950/70 text-indigo-300 border-indigo-800/60 font-mono uppercase"
                >
                  {pageBadge}
                </Badge>
              )}
            </div>
          </Link>

          {/* Profile Owner Breadcrumb Pill (if viewing a profile) */}
          {profileUsername && (
            <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400">galaxy:</span>
              <span className="text-xs font-semibold text-slate-200">@{profileUsername}</span>
            </div>
          )}
        </div>

        {/* ================= CENTER: Repo Filter & View Toggle ================= */}
        <div className="flex items-center space-x-2 sm:space-x-3 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-center">
          {/* Repo Filter Dropdown */}
          {onSelectRepo && (
            <div className="flex items-center min-w-[170px] sm:min-w-[210px] max-w-[260px]">
              <label htmlFor="repo-filter-select" className="sr-only">
                Filter galaxy by repository
              </label>
              <Select value={selectedRepoId} onValueChange={onSelectRepo}>
                <SelectTrigger
                  id="repo-filter-select"
                  aria-label="Filter galaxy by repository"
                  className="h-8 text-xs border-slate-800 bg-slate-950/90 text-slate-200 hover:border-slate-700 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{selectedRepoLabel}</span>
                  </div>
                </SelectTrigger>
                <SelectContent align="center" className="border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl">
                  <SelectItem value="all" className="text-xs py-1.5">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="font-semibold text-slate-200">All repositories</span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-slate-800 text-slate-300">
                        {totalCommits}
                      </Badge>
                    </div>
                  </SelectItem>
                  {projects.map((proj) => {
                    const commitCount = repoCommitCounts[proj.id] ?? 0;
                    return (
                      <SelectItem key={proj.id} value={proj.id} className="text-xs py-1.5">
                        <div className="flex items-center justify-between w-full gap-3">
                          <span className="truncate max-w-[150px]">{proj.repoName}</span>
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-slate-800 text-slate-300 font-mono">
                            {commitCount}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Accessible View Switcher (Segmented Control) */}
          {onToggleListView && (
            <div
              role="radiogroup"
              aria-label="Galaxy visualization mode"
              className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!isListView}
                aria-label="Switch to 3D interactive galaxy view"
                onClick={() => onToggleListView(false)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  !isListView
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">3D Galaxy</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={isListView}
                aria-label="Switch to accessible 2D list view"
                onClick={() => onToggleListView(true)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isListView
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Accessible List</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT: Streak, Avatar, and Sign-Out ================= */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 order-2 sm:order-3 ml-auto sm:ml-0">
          {/* Flame Streak Badge */}
          <div
            title={`Current Daily Commit Streak: ${streakDaysText}`}
            className="flex items-center"
          >
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-950/60 border-orange-800/60 text-orange-300 font-semibold text-xs shadow-sm shadow-orange-500/10 hover:bg-orange-950/80 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" aria-hidden="true" />
              <span>{streakDaysText}</span>
            </Badge>
          </div>

          {/* Signed-in User Avatar & Profile Link */}
          {signedInUser ? (
            <div className="flex items-center space-x-2">
              <Link
                href={signedInUsername ? `/u/${signedInUsername}` : '/dashboard'}
                aria-label={`View ${signedInUsername || 'your'}'s galaxy`}
                className="group relative flex items-center rounded-full p-0.5 ring-1 ring-slate-700 hover:ring-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {signedInAvatar ? (
                  <Image
                    src={signedInAvatar}
                    alt={signedInUsername ? `${signedInUsername}'s avatar` : 'User avatar'}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-900/80 flex items-center justify-center text-indigo-200 font-bold text-xs">
                    {(signedInUsername || 'CC').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Quick Link to Observatory Dashboard */}
              <Link
                href="/dashboard"
                className="hidden lg:inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Observatory</span>
              </Link>

              {/* Sign-Out Control */}
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default AppNavbar;
