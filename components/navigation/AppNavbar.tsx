'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Flame, FolderGit2, Box, ListFilter, LayoutDashboard } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SignInButton } from '@/components/auth/SignInButton';
import type { GalaxyProject } from '@/lib/queries';

export interface AppNavbarProps {
  profileUsername?: string;
  profileAvatarUrl?: string | null;
  currentUser?: {
    id?: string;
    githubUsername?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
  } | null;
  currentStreak?: number;
  totalCommits?: number;
  projects?: GalaxyProject[];
  selectedRepoId?: string;
  onSelectRepo?: (repoId: string) => void;
  repoCommitCounts?: Record<string, number>;
  isListView?: boolean;
  onToggleListView?: (isList: boolean) => void;
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
  const { data: session } = useSession();

  const signedInUser = initialUser || session?.user || null;
  const signedInUsername = signedInUser?.githubUsername;
  const signedInAvatar =
    signedInUser?.image ||
    (signedInUser && 'avatarUrl' in signedInUser ? (signedInUser as { avatarUrl?: string | null }).avatarUrl : null) ||
    (profileUsername === signedInUsername ? profileAvatarUrl : null);

  const streakDaysText = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
  const selectedProject = projects.find((p) => p.id === selectedRepoId);
  const selectedRepoLabel =
    selectedRepoId === 'all'
      ? `All repos (${totalCommits})`
      : `${selectedProject?.repoName || 'Selected repo'} (${repoCommitCounts[selectedRepoId] ?? 0})`;

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 w-full transition-all"
      style={{
        background: 'rgba(2,0,10,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Subtle gradient top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(6,182,212,0.4), transparent)' }} />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* ── LEFT: Brand ── */}
        <div className="flex items-center space-x-3">
          <Link href="/" aria-label="CommitCosmos Homepage"
            className="group flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl p-1">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #4c1d95, #0e7490)', boxShadow: '0 0 16px rgba(139,92,246,0.35)' }}>
              <Image src="/commitcosmos_logo.png" alt="CommitCosmos Logo" width={32} height={32}
                className="w-full h-full object-cover" priority />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                Commit<span className="text-gradient-cosmic">Cosmos</span>
              </span>
              {pageBadge && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(109,40,217,0.2)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                  {pageBadge}
                </span>
              )}
            </div>
          </Link>

          {profileUsername && (
            <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-white/10">
              <span className="text-xs text-slate-500">galaxy:</span>
              <span className="text-xs font-semibold text-slate-200">@{profileUsername}</span>
            </div>
          )}
        </div>

        {/* ── CENTER: Repo Filter & View Toggle ── */}
        <div className="flex items-center space-x-2 sm:space-x-3 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-center">
          {onSelectRepo && (
            <div className="flex items-center min-w-[170px] sm:min-w-[210px] max-w-[260px]">
              <label htmlFor="repo-filter-select" className="sr-only">Filter galaxy by repository</label>
              <Select value={selectedRepoId} onValueChange={onSelectRepo}>
                <SelectTrigger
                  id="repo-filter-select"
                  aria-label="Filter galaxy by repository"
                  className="h-8 text-xs border-white/10 text-slate-200 hover:border-violet-500/50 transition-colors rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center space-x-1.5 truncate">
                    <FolderGit2 className="w-3.5 h-3.5 text-violet-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{selectedRepoLabel}</span>
                  </div>
                </SelectTrigger>
                <SelectContent align="center" className="border-white/10 text-slate-100 shadow-2xl backdrop-blur-xl rounded-xl"
                  style={{ background: 'rgba(10,0,30,0.95)' }}>
                  <SelectItem value="all" className="text-xs py-1.5">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="font-semibold text-slate-200">All repositories</span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5"
                        style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
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
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
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

          {onToggleListView && (
            <div role="radiogroup" aria-label="Galaxy visualization mode"
              className="inline-flex p-0.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button type="button" role="radio" aria-checked={!isListView} aria-label="Switch to 3D interactive galaxy view"
                onClick={() => onToggleListView(false)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  !isListView ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={!isListView ? { background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' } : {}}>
                <Box className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">3D Galaxy</span>
              </button>
              <button type="button" role="radio" aria-checked={isListView} aria-label="Switch to accessible 2D list view"
                onClick={() => onToggleListView(true)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  isListView ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={isListView ? { background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' } : {}}>
                <ListFilter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">List View</span>
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Streak + Avatar + Actions ── */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 order-2 sm:order-3 ml-auto sm:ml-0">
          {/* Streak Badge */}
          <div title={`Current Daily Commit Streak: ${streakDaysText}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', boxShadow: '0 0 12px rgba(245,158,11,0.2)' }}>
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" aria-hidden="true" />
            <span>{streakDaysText}</span>
          </div>

          {signedInUser ? (
            <div className="flex items-center space-x-2">
              {/* Avatar */}
              <Link href={signedInUsername ? `/u/${signedInUsername}` : '/dashboard'}
                aria-label={`View ${signedInUsername || 'your'}'s galaxy`}
                className="group relative flex items-center rounded-full p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                style={{ border: '1px solid rgba(139,92,246,0.3)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(139,92,246,0.5)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = ''}>
                {signedInAvatar ? (
                  <Image src={signedInAvatar} alt={signedInUsername ? `${signedInUsername}'s avatar` : 'User avatar'}
                    width={28} height={28} className="w-7 h-7 rounded-full object-cover" unoptimized />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
                    {(signedInUsername || 'CC').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Observatory link */}
              <Link href="/dashboard"
                className="hidden lg:inline-flex items-center gap-1 h-8 px-3 rounded-xl text-xs text-slate-400 hover:text-slate-100 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Observatory</span>
              </Link>

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
