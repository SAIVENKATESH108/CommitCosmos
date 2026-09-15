'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Flame,
  GitCommit,
  FolderGit2,
  Trophy,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Layers,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SignOutButton } from '@/components/auth/SignOutButton';
import type { UserStats, Project, Constellation, Commit } from '@/db/schema';

interface DashboardClientProps {
  user: {
    id: string;
    githubUsername: string;
    name?: string | null;
    image?: string | null;
  };
  stats: UserStats | null;
  projects: Project[];
  constellations: Constellation[];
  recentCommits: Commit[];
  productionUrl: string;
  webhookSecret: string;
}

export function DashboardClient({
  user,
  stats,
  projects,
  constellations,
  recentCommits,
  productionUrl,
  webhookSecret,
}: DashboardClientProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('clusters');

  const webhookPayloadUrl = `${productionUrl}/api/webhooks/github`;
  const galaxyProfileUrl = `${productionUrl}/u/${user.githubUsername}`;

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalCommits = stats?.totalCommits ?? 0;
  const totalProjects = stats?.totalProjects ?? projects.length;

  // Streak threshold calculations towards next 7-day constellation forge
  const daysToNextConstellation = currentStreak % 7 === 0 && currentStreak > 0 ? 0 : 7 - (currentStreak % 7);
  const streakProgressPercent = Math.min(100, Math.round(((7 - daysToNextConstellation) / 7) * 100));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const spectralClasses = [
    { name: 'Nebula Cyan', code: '#38bdf8', lang: 'TypeScript', classType: 'Class O (Supergiant)' },
    { name: 'Supernova Orange', code: '#fb923c', lang: 'Rust', classType: 'Class K (Hypernova)' },
    { name: 'Stellar Blue', code: '#60a5fa', lang: 'Python', classType: 'Class B (Luminous Giant)' },
    { name: 'Solar Gold', code: '#facc15', lang: 'JavaScript', classType: 'Class G (Main Sequence)' },
    { name: 'Pulsar Teal', code: '#2dd4bf', lang: 'Go', classType: 'Class A (Rapid Rotator)' },
    { name: 'Cosmic Violet', code: '#c084fc', lang: 'C++ / Swift / Other', classType: 'Class M (Nebular Core)' },
  ];

  const constellationMilestones = [
    {
      id: 'genesis',
      name: 'The Genesis Spark',
      description: 'First Git push ingested into the stellar core.',
      unlocked: totalCommits > 0,
      streak: '1 commit',
      icon: '✦',
    },
    {
      id: 'runner',
      name: 'Nebula Runner',
      description: 'Maintained 3 consecutive days of code velocity.',
      unlocked: currentStreak >= 3 || longestStreak >= 3,
      streak: '3-day streak',
      icon: '⚡',
    },
    {
      id: 'orion',
      name: "Orion's Belt",
      description: 'Complete celestial 7-day streak. Unlocks dynamic 3D constellation connectors.',
      unlocked: currentStreak >= 7 || longestStreak >= 7 || constellations.length > 0,
      streak: '7-day streak',
      icon: '🌌',
    },
    {
      id: 'titan',
      name: 'Cosmic Titan',
      description: 'Prolific contributor status with over 50 stars in orbit.',
      unlocked: totalCommits >= 50,
      streak: '50+ commits',
      icon: '👑',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient Celestial Nebulae Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px] -translate-y-48 -translate-x-32" />
        <div className="h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px] translate-y-36 translate-x-48" />
        <div className="h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[130px] translate-y-64 -translate-x-48" />
      </div>

      {/* Top Observatory Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/40 shadow-lg shadow-indigo-500/20 bg-[#030712]">
              <Image
                src="/commitcosmos_logo.png"
                alt="CommitCosmos Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-base flex items-center gap-2">
                CommitCosmos
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Observatory
                </span>
              </span>
            </div>
          </Link>

          {/* Right User Bar */}
          <div className="flex items-center gap-3">
            <Link
              href={`/u/${user.githubUsername}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Launch 3D Galaxy</span>
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-900">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.githubUsername}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-indigo-300">
                    {user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200">@{user.githubUsername}</span>
                <span className="text-[10px] text-slate-400 font-mono">Cosmonaut Architect</span>
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Welcome Cosmic Banner */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950/90 via-indigo-950/30 to-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-8"
        >
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="relative hidden sm:block w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/40 p-0.5 bg-[#030712] shadow-xl shadow-indigo-500/20 shrink-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.githubUsername}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-xl text-indigo-300">
                    {user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#030712] rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="border-indigo-500/40 bg-indigo-950/60 text-indigo-300 text-[11px] gap-1 px-2.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Active Telemetry</span>
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">ID: {user.id.slice(0, 8)}...</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome to your Observatory,{' '}
                  <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                    @{user.githubUsername}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
                  Every commit lights an isotropic 3D star. Maintain consistency to weave shining constellations across your connected repository star clusters.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/u/${user.githubUsername}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Enter 3D Galaxy</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>

              <button
                onClick={() => copyToClipboard(galaxyProfileUrl, 'galaxyUrl')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-all shadow-sm"
              >
                {copiedField === 'galaxyUrl' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Profile Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Share URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.section>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Stars Ignited */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-cyan-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stars Ignited</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <GitCommit className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalCommits}</span>
              <span className="text-xs text-slate-500 font-medium">total commits</span>
            </div>
            <p className="mt-2 text-[11px] text-cyan-400/80 flex items-center gap-1 font-mono">
              <span>✦</span> Spectral class mapped
            </p>
          </motion.div>

          {/* Card 2: Current Streak */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-2xl border border-amber-500/20 bg-slate-950/70 p-5 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Streak</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-300">{currentStreak}</span>
              <span className="text-xs text-slate-500 font-medium">days active</span>
            </div>
            <div className="mt-2.5">
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${streakProgressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 font-mono flex justify-between">
                <span>{daysToNextConstellation === 0 ? 'Constellation Unlocked!' : `${daysToNextConstellation}d to 7-day milestone`}</span>
                <span>{streakProgressPercent}%</span>
              </p>
            </div>
          </motion.div>

          {/* Card 3: Longest Streak */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-yellow-500/20 bg-slate-950/70 p-5 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-yellow-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Peak Streak</span>
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{longestStreak}</span>
              <span className="text-xs text-slate-500 font-medium">record days</span>
            </div>
            <p className="mt-2 text-[11px] text-yellow-400/80 flex items-center gap-1 font-mono">
              <span>🏆</span> Celestial milestone
            </p>
          </motion.div>

          {/* Card 4: Connected Repos */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl border border-indigo-500/20 bg-slate-950/70 p-5 backdrop-blur-md relative overflow-hidden shadow-lg group hover:border-indigo-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Star Clusters</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalProjects}</span>
              <span className="text-xs text-slate-500 font-medium">connected repos</span>
            </div>
            <p className="mt-2 text-[11px] text-indigo-300 flex items-center gap-1 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-time webhook active</span>
            </p>
          </motion.div>
        </div>

        {/* Interactive Tabbed Command Center */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Celestial Operations</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage connected repositories, configure webhooks, track constellations, and explore star spectral models.
                </p>
              </div>

              <TabsList className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
                <TabsTrigger value="clusters" className="text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
                  Star Clusters ({projects.length})
                </TabsTrigger>
                <TabsTrigger value="webhook" className="text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
                  Webhook Setup
                </TabsTrigger>
                <TabsTrigger value="constellations" className="text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
                  Constellations ({constellations.length})
                </TabsTrigger>
                <TabsTrigger value="spectrals" className="text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg">
                  Spectral Engine
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Star Clusters (Repositories) */}
            <TabsContent value="clusters" className="pt-6">
              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-950/10 p-8 sm:p-12 text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-xl shadow-indigo-600/20">
                    <FolderGit2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Star Clusters Connected Yet</h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                    CommitCosmos turns every GitHub repository into a distinct star cluster in your 3D universe.
                    Add a webhook to your repository to automatically ingest commits and light up your galaxy!
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      onClick={() => setActiveTab('webhook')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/25"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      <span>Setup GitHub Webhook (60 seconds)</span>
                    </Button>
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
                    >
                      <span>Create New GitHub Repo</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <motion.div
                      key={proj.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-all flex flex-col justify-between group shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <FolderGit2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                                {proj.repoName}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Cluster ID: {proj.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[10px]">
                            Live Synced
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-4">
                          {proj.repoUrl}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Connected {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Open Repository</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Webhook Setup Wizard */}
            <TabsContent value="webhook" className="pt-6">
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 flex items-start gap-3.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white font-semibold block mb-0.5">Defensive Ingestion Architecture</strong>
                    CommitCosmos verifies GitHub webhook payloads using <strong>HMAC-SHA256</strong> signatures and applies an <strong>Upstash Redis sliding window</strong> rate limit (100 req / 60s). Only authenticated, signed commits trigger star ignition.
                  </div>
                </div>

                {/* Configuration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Field 1: Payload URL */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        1. Webhook Payload URL
                      </span>
                      <p className="text-xs font-mono text-cyan-300 bg-black/40 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                        {webhookPayloadUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(webhookPayloadUrl, 'payloadUrl')}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                    >
                      {copiedField === 'payloadUrl' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied URL!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Payload URL</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Field 2: Secret */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        2. Webhook Secret (HMAC-SHA256)
                      </span>
                      <p className="text-xs font-mono text-amber-300 bg-black/40 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                        {webhookSecret}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(webhookSecret, 'secret')}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                    >
                      {copiedField === 'secret' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied Secret!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Webhook Secret</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3 Step Guide Accordion */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>How to Add to GitHub Repository</span>
                  </h4>
                  <ol className="space-y-2.5 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
                    <li>
                      Open your repository on GitHub ➔ Navigate to <strong>Settings</strong> ➔ <strong>Webhooks</strong> ➔ Click <strong>Add webhook</strong>.
                    </li>
                    <li>
                      Paste the <strong>Payload URL</strong> and <strong>Secret</strong> from the cards above. Set <strong>Content type</strong> to <code className="text-cyan-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">application/json</code>.
                    </li>
                    <li>
                      Select <strong>&quot;Just the push event&quot;</strong>, make sure <strong>Active</strong> is checked, and click <strong>Add webhook</strong>.
                    </li>
                  </ol>

                  {/* Ignition test command */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-1 font-semibold">
                      ⚡ Quick Test: Fire an ignition commit to test live streaming
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-emerald-400">
                      <span className="truncate">git commit --allow-empty -m &quot;✨ Ignite CommitCosmos star&quot; &amp;&amp; git push</span>
                      <button
                        onClick={() => copyToClipboard('git commit --allow-empty -m "✨ Ignite CommitCosmos star" && git push', 'gitCommand')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copy command"
                      >
                        {copiedField === 'gitCommand' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Constellations Codex */}
            <TabsContent value="constellations" className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {constellationMilestones.map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      c.unlocked
                        ? 'border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 to-slate-950/70 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800/80 bg-slate-950/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{c.icon}</span>
                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      </div>
                      <Badge
                        variant={c.unlocked ? 'default' : 'outline'}
                        className={c.unlocked ? 'bg-indigo-600 text-white text-[10px]' : 'border-slate-700 text-slate-500 text-[10px]'}
                      >
                        {c.unlocked ? 'Unlocked' : 'Locked'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{c.description}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Requirement:</span>
                      <span className={c.unlocked ? 'text-indigo-300 font-semibold' : 'text-slate-500'}>{c.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 4: Spectral Class Legend */}
            <TabsContent value="spectrals" className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {spectralClasses.map((s) => (
                  <div
                    key={s.name}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full shadow-lg shrink-0"
                        style={{ backgroundColor: s.code, boxShadow: `0 0 12px ${s.code}80` }}
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{s.lang}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.classType}</span>
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-slate-700"
                      style={{ color: s.code }}
                    >
                      {s.code}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Ingested Star Stream */}
        <div className="mt-8 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                <span>Live Stellar Ingestion Stream</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time commits ingested through your verified webhook endpoint.
              </p>
            </div>
            <Link
              href={`/u/${user.githubUsername}`}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>View in 3D Galaxy</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCommits.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-slate-900 rounded-2xl bg-black/20">
              <Sparkles className="w-5 h-5 text-slate-600 mx-auto mb-2 animate-pulse" />
              <span>No commits ingested yet. Push your first commit to see the star stream light up!</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentCommits.slice(0, 8).map((commit) => (
                <div
                  key={commit.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-900/60 transition-all text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_#38bdf8]" />
                    <span className="font-medium text-slate-200 truncate">
                      {commit.message || 'No commit message'}
                    </span>
                    {commit.language && (
                      <Badge variant="outline" className="text-[10px] border-slate-700 font-mono shrink-0">
                        {commit.language}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-400">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {commit.sha.slice(0, 7)}
                    </span>
                    <span>
                      {new Date(commit.committedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
