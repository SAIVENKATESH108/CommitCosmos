'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalaxyData, useUserStats } from '@/lib/queries';
import { useGalaxyStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GalaxyListView } from '@/components/galaxy/GalaxyListView';
import {
  Sparkles,
  GitCommit,
  Flame,
  FolderGit2,
  AlertCircle,
  Compass,
  Box,
  ListFilter,
} from 'lucide-react';

// Dynamically import GalaxyScene with SSR disabled since WebGL Canvas depends on browser DOM & GPU
const GalaxyScene = dynamic(
  () => import('@/components/galaxy/GalaxyScene').then((mod) => mod.GalaxyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#030712] text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium tracking-wide">Igniting galaxy engine...</p>
      </div>
    ),
  }
);

interface UserProfileClientProps {
  username: string;
}

export function UserProfileClient({ username }: UserProfileClientProps) {
  const { isAccessibilityListView, setAccessibilityListView } = useGalaxyStore();

  // Fetch real-time polled galaxy dataset & aggregate statistics
  const {
    data: galaxy,
    isLoading: isGalaxyLoading,
    isError: isGalaxyError,
    error: galaxyError,
  } = useGalaxyData(username);

  const { data: stats } = useUserStats(username);

  // 1. Loading Skeleton State
  if (isGalaxyLoading) {
    return (
      <div className="relative w-screen min-h-screen bg-[#030712] flex flex-col overflow-hidden">
        {/* Top Navbar Skeleton */}
        <div className="p-6 flex items-center justify-between border-b border-slate-900 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full bg-slate-800" />
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-5 bg-slate-800" />
              <Skeleton className="w-24 h-3.5 bg-slate-800/60" />
            </div>
          </div>
          <Skeleton className="w-36 h-9 rounded-lg bg-slate-800" />
        </div>

        {/* Center Loading Spinner */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide">Mapping celestial coordinates...</p>
        </div>
      </div>
    );
  }

  // 2. Error State (e.g. user not found or rate-limited)
  if (isGalaxyError || !galaxy) {
    return (
      <main className="w-screen min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-950/40 border border-red-800/50 mb-4 text-red-400">
          <AlertCircle className="w-10 h-10" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Cosmic Anomaly Encountered</h1>
        <p className="text-slate-400 max-w-md mb-6">
          {galaxyError?.message || `Could not find a celestial galaxy for @${username}.`}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Return to Observatory
        </Link>
      </main>
    );
  }

  // 3. Empty State: Zero commits recorded yet
  const totalCommits = stats?.totalCommits ?? galaxy.totalStars ?? galaxy.commits.length;
  if (totalCommits === 0) {
    return (
      <main className="relative w-screen min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute w-96 h-96 rounded-full bg-indigo-900/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Compass className="w-10 h-10 animate-pulse" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Awaiting First Ignition for @{username}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every cosmic journey begins with a spark. As soon as you push your first Git commit
              to your connected repository, your stellar core will ignite and light up your very own
              celestial galaxy!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-md shadow-indigo-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Connect GitHub Repository
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Common metrics
  const currentStreak = stats?.currentStreak ?? galaxy.streak?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? galaxy.streak?.longestStreak ?? 0;
  const projectCount = stats?.totalProjects ?? galaxy.projects.length;

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#030712] text-slate-100 flex flex-col">
      {/* Universal Top Header with User Info and View Toggle */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 py-3.5 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
        {/* Left: User Identifier Pill */}
        <Link
          href="/"
          aria-label={`CommitCosmos Home - Viewing ${galaxy.user.githubUsername}'s galaxy`}
          className="group flex items-center space-x-3 p-1.5 pr-3.5 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {galaxy.user.avatarUrl ? (
            <Image
              src={galaxy.user.avatarUrl}
              alt={`${galaxy.user.githubUsername}'s profile avatar`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full ring-1 ring-indigo-500/50"
              unoptimized
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-full bg-indigo-900/70 flex items-center justify-center text-indigo-200 font-bold text-xs"
            >
              {galaxy.user.githubUsername.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-white font-semibold text-xs sm:text-sm group-hover:text-indigo-300 transition-colors">
                @{galaxy.user.githubUsername}
              </span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-indigo-950/80 text-indigo-300 border-indigo-800/50">
                Galaxy
              </Badge>
            </div>
          </div>
        </Link>

        {/* Right: Accessible View Switcher (Segmented Control) */}
        <div
          role="radiogroup"
          aria-label="Galaxy display modality"
          className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!isAccessibilityListView}
            aria-label="Switch to 3D interactive galaxy view"
            onClick={() => setAccessibilityListView(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              !isAccessibilityListView
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">3D Galaxy</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={isAccessibilityListView}
            aria-label="Switch to accessible 2D table list view"
            onClick={() => setAccessibilityListView(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              isAccessibilityListView
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Accessible List</span>
          </button>
        </div>
      </header>

      {/* Main View Area: Either 3D Galaxy Canvas OR Accessible Table with Framer Motion Transition */}
      <main className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          {isAccessibilityListView ? (
            /* ================= Accessible 2D Table Modality ================= */
            <motion.div
              key="accessible-list-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex-1 bg-[#030712] py-4"
            >
              <GalaxyListView galaxy={galaxy} stats={stats} />
            </motion.div>
          ) : (
            /* ================= Interactive 3D WebGL Modality ================= */
            <motion.div
              key="interactive-3d-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative w-full h-[calc(100vh-61px)] min-h-[500px]"
            >
              {/* 3D WebGL Canvas */}
              <GalaxyScene
                commits={galaxy.commits}
                projects={galaxy.projects}
                constellations={galaxy.constellations}
              />

            {/* Floating Top-Right Stats Card */}
            <aside aria-label="Galaxy Metrics" className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-auto">
              <Card className="w-72 sm:w-80 bg-slate-950/85 border-slate-800/80 backdrop-blur-md shadow-2xl text-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-800/60 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                    <span>Celestial Metrics</span>
                  </CardTitle>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    Live 20s
                  </span>
                </CardHeader>

                <CardContent className="p-4 pt-3 space-y-2.5">
                  {/* Total Stars / Commits */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300" aria-hidden="true">
                        <GitCommit className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">Stars (Commits)</span>
                    </div>
                    <span className="text-sm font-bold text-white">{totalCommits}</span>
                  </div>

                  {/* Streak Counter */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-300" aria-hidden="true">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-slate-300">Daily Streak</span>
                        <span className="block text-[10px] text-slate-400">Best: {longestStreak}d</span>
                      </div>
                    </div>
                    <Badge className="bg-orange-950/70 text-orange-300 border-orange-800/50 text-xs">
                      {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>

                  {/* Connected Projects */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-300" aria-hidden="true">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-300">Constellation Clusters</span>
                    </div>
                    <span className="text-sm font-bold text-white">{projectCount}</span>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Bottom-Center Interactive Controls Hint */}
            <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="px-4 py-1.5 rounded-full bg-slate-950/75 border border-slate-800/70 backdrop-blur-sm text-[11px] sm:text-xs text-slate-300 flex items-center space-x-2 shadow-lg">
                <span>Drag to orbit</span>
                <span className="text-slate-600" aria-hidden="true">•</span>
                <span>Scroll to zoom</span>
                <span className="text-slate-600" aria-hidden="true">•</span>
                <span>Click star to inspect</span>
              </div>
            </footer>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
export default UserProfileClient;
