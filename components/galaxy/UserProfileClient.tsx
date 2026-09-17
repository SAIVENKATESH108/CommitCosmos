'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalaxyData, useUserStats } from '@/lib/queries';
import { useGalaxyStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GalaxyListView } from '@/components/galaxy/GalaxyListView';
import { AppNavbar } from '@/components/navigation/AppNavbar';
import {
  Sparkles,
  GitCommit,
  Flame,
  FolderGit2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { CosmicPersonaCard } from '@/components/galaxy/CosmicPersonaCard';
import { GalaxyTimelineScrubber } from '@/components/galaxy/GalaxyTimelineScrubber';

// Dynamically import GalaxyScene with SSR disabled since WebGL Canvas depends on browser DOM & GPU
const GalaxyScene = dynamic(
  () => import('@/components/galaxy/GalaxyScene').then((mod) => mod.GalaxyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-black text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium tracking-wide">Igniting galaxy engine...</p>
      </div>
    ),
  }
);

interface UserProfileClientProps {
  username: string;
  sessionUser?: {
    id?: string;
    githubUsername?: string | null;
    avatarUrl?: string | null;
    image?: string | null;
  } | null;
}

export function UserProfileClient({ username, sessionUser }: UserProfileClientProps) {
  const { isAccessibilityListView, setAccessibilityListView } = useGalaxyStore();
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [activeSideTab, setActiveSideTab] = useState<'metrics' | 'persona'>('metrics');

  // Fetch real-time polled galaxy dataset & aggregate statistics
  const {
    data: galaxy,
    isLoading: isGalaxyLoading,
    isError: isGalaxyError,
    error: galaxyError,
  } = useGalaxyData(username);

  const { data: stats } = useUserStats(username);

  // Unified Filtering Implementation:
  // Both 3D galaxy view and accessible list view consume this single filtered data source.
  const repoCommitCounts = useMemo(() => {
    if (!galaxy?.commits) return {};
    const counts: Record<string, number> = {};
    galaxy.commits.forEach((c) => {
      counts[c.projectId] = (counts[c.projectId] || 0) + 1;
    });
    return counts;
  }, [galaxy?.commits]);

  const filteredCommits = useMemo(() => {
    if (!galaxy?.commits) return [];
    if (selectedRepoId === 'all') return galaxy.commits;
    return galaxy.commits.filter((c) => c.projectId === selectedRepoId);
  }, [galaxy?.commits, selectedRepoId]);

  const filteredProjects = useMemo(() => {
    if (!galaxy?.projects) return [];
    if (selectedRepoId === 'all') return galaxy.projects;
    return galaxy.projects.filter((p) => p.id === selectedRepoId);
  }, [galaxy?.projects, selectedRepoId]);

  const filteredBranches = useMemo(() => {
    if (!galaxy?.branches) return [];
    if (selectedRepoId === 'all') return galaxy.branches;
    return galaxy.branches.filter((b) => b.projectId === selectedRepoId);
  }, [galaxy?.branches, selectedRepoId]);

  const filteredReleases = useMemo(() => {
    if (!galaxy?.releases) return [];
    if (selectedRepoId === 'all') return galaxy.releases;
    return galaxy.releases.filter((r) => r.projectId === selectedRepoId);
  }, [galaxy?.releases, selectedRepoId]);

  const filteredGalaxy = useMemo(() => {
    if (!galaxy) return null;
    return {
      ...galaxy,
      commits: filteredCommits,
      projects: filteredProjects,
      branches: filteredBranches,
      releases: filteredReleases,
      totalStars: filteredCommits.length,
    };
  }, [galaxy, filteredCommits, filteredProjects, filteredBranches, filteredReleases]);

  // Overall & streak metrics
  const currentStreak = stats?.currentStreak ?? galaxy?.streak?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? galaxy?.streak?.longestStreak ?? 0;
  const projectCount = filteredProjects.length;
  const displayCommitCount = filteredCommits.length;

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-black text-slate-100 flex flex-col">
      {/* ================= 1. PERSISTENT APP SHELL TOP NAVIGATION BAR ================= */}
      {/* Chrome component: visible site-wide and preserved identically across loading, 3D, and List views */}
      <AppNavbar
        profileUsername={galaxy?.user?.githubUsername || username}
        profileAvatarUrl={galaxy?.user?.avatarUrl}
        currentUser={sessionUser}
        currentStreak={currentStreak}
        totalCommits={galaxy?.commits?.length || 0}
        projects={galaxy?.projects || []}
        selectedRepoId={selectedRepoId}
        onSelectRepo={setSelectedRepoId}
        repoCommitCounts={repoCommitCounts}
        isListView={isAccessibilityListView}
        onToggleListView={setAccessibilityListView}
        isLoading={isGalaxyLoading}
      />

      {/* ================= 2. MAIN VIEWPORT ================= */}
      {isGalaxyLoading ? (
        /* Explicit Loading State: Clearly distinct from genuine zero-commit protostar state */
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm tracking-wide">Mapping celestial coordinates...</p>
        </div>
      ) : isGalaxyError || !galaxy ? (
        /* Error Anomaly State */
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
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
      ) : (
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
                className="flex-1 bg-black py-4"
              >
                <GalaxyListView galaxy={filteredGalaxy!} stats={stats} />
              </motion.div>
          ) : (
            /* ================= Interactive 3D WebGL Modality ================= */
            <motion.div
              key="interactive-3d-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative w-full h-[calc(100vh-57px)] min-h-[500px]"
            >
              {/* 3D WebGL Canvas (renders stars, or genuine ProtostarCore when 0 commits) */}
              <GalaxyScene
                commits={filteredCommits}
                projects={filteredProjects}
                branches={filteredBranches}
                releases={filteredReleases}
                closedIssues={galaxy.closedIssues}
                constellations={galaxy.constellations}
                username={username}
              />

              {/* Floating Top-Right Stats & Cosmic Persona Card */}
              <aside
                aria-label="Celestial Operations"
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-auto flex flex-col gap-2 w-72 sm:w-80"
              >
                {/* Tab Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-md shadow-lg">
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('metrics')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeSideTab === 'metrics'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Metrics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('persona')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeSideTab === 'persona'
                        ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>✦ Persona</span>
                  </button>
                </div>

                {activeSideTab === 'metrics' ? (
                  <Card className="w-full bg-slate-950/85 border-slate-800/80 backdrop-blur-md shadow-2xl text-slate-200">
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
                      {/* Stars in View */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300" aria-hidden="true">
                            <GitCommit className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-300">
                            {selectedRepoId === 'all' ? 'Stars (Commits)' : 'Repo Stars'}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">{displayCommitCount}</span>
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
                          <span className="text-xs font-medium text-slate-300">
                            {selectedRepoId === 'all' ? 'Constellation Clusters' : 'Active Cluster'}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white">{projectCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <CosmicPersonaCard
                    username={galaxy?.user?.githubUsername || username}
                    commits={galaxy?.commits || []}
                    projects={galaxy?.projects || []}
                    streak={currentStreak}
                  />
                )}
              </aside>

              {/* Bottom Interactive Time-Lapse Scrubber */}
              <GalaxyTimelineScrubber commits={filteredCommits} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}
    </div>
  );
}
export default UserProfileClient;
