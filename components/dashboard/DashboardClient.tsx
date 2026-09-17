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
  Star,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AppNavbar } from '@/components/navigation/AppNavbar';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSyncRepos = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to GitHub API to discover repositories...');
    try {
      const res = await fetch('/api/repos/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.githubUsername }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(`✓ Successfully synced ${data.syncedProjects ?? 0} repositories! Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setSyncStatus(`Error: ${data.error || 'Failed to sync repositories'}`);
      }
    } catch {
      setSyncStatus('Network error synchronizing with GitHub.');
    } finally {
      setTimeout(() => setIsSyncing(false), 2500);
    }
  };

  const webhookPayloadUrl = `${productionUrl}/api/webhooks/github`;
  const galaxyProfileUrl = `${productionUrl}/u/${user.githubUsername}`;

  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalCommits = stats?.totalCommits ?? 0;
  const totalProjects = stats?.totalProjects ?? projects.length;

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
    { id: 'genesis', name: 'The Genesis Spark', description: 'First Git push ingested into the stellar core.', unlocked: totalCommits > 0, streak: '1 commit', icon: '✦' },
    { id: 'runner', name: 'Nebula Runner', description: 'Maintained 3 consecutive days of code velocity.', unlocked: currentStreak >= 3 || longestStreak >= 3, streak: '3-day streak', icon: '⚡' },
    { id: 'orion', name: "Orion's Belt", description: 'Complete celestial 7-day streak. Unlocks dynamic 3D constellation connectors.', unlocked: currentStreak >= 7 || longestStreak >= 7 || constellations.length > 0, streak: '7-day streak', icon: '🌌' },
    { id: 'titan', name: 'Cosmic Titan', description: 'Prolific contributor status with over 50 stars in orbit.', unlocked: totalCommits >= 50, streak: '50+ commits', icon: '👑' },
  ];

  const metricCards = [
    {
      label: 'Stars Ignited', value: totalCommits, unit: 'total commits',
      icon: <GitCommit className="w-4 h-4" />, color: '#06b6d4',
      glow: 'rgba(6,182,212,0.25)', border: 'rgba(6,182,212,0.25)',
      bg: 'rgba(6,182,212,0.06)', subtext: '✦ Spectral class mapped', subColor: '#22d3ee',
      valueColor: 'white',
    },
    {
      label: 'Current Streak', value: currentStreak, unit: 'days active',
      icon: <Flame className="w-4 h-4" />, color: '#f59e0b',
      glow: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.25)',
      bg: 'rgba(245,158,11,0.06)', subtext: daysToNextConstellation === 0 ? '🌌 Constellation Unlocked!' : `${daysToNextConstellation}d to 7-day milestone`,
      subColor: '#fbbf24', valueColor: '#fbbf24', hasProgress: true,
    },
    {
      label: 'Peak Streak', value: longestStreak, unit: 'record days',
      icon: <Trophy className="w-4 h-4" />, color: '#eab308',
      glow: 'rgba(234,179,8,0.25)', border: 'rgba(234,179,8,0.25)',
      bg: 'rgba(234,179,8,0.06)', subtext: '🏆 Celestial milestone', subColor: '#fde047',
      valueColor: 'white',
    },
    {
      label: 'Star Clusters', value: totalProjects, unit: 'connected repos',
      icon: <FolderGit2 className="w-4 h-4" />, color: '#a78bfa',
      glow: 'rgba(167,139,250,0.25)', border: 'rgba(167,139,250,0.25)',
      bg: 'rgba(167,139,250,0.06)', subtext: '● Real-time webhook active', subColor: '#34d399',
      valueColor: 'white',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-100" style={{ background: '#02000a' }}>
      {/* Ambient nebulae */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/4 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      <AppNavbar currentUser={user} currentStreak={currentStreak} totalCommits={totalCommits} pageBadge="Observatory" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero Welcome Banner ── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-7 sm:p-10"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', boxShadow: '0 40px 80px rgba(109,40,217,0.15)' }}>
          {/* Background gradient accent */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)', filter: 'blur(40px)' }} />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative hidden sm:block w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ border: '2px solid rgba(139,92,246,0.4)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}>
                {user.image ? (
                  <Image src={user.image} alt={user.githubUsername} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
                    {user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(52,211,153,0.7)' }} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                    <Sparkles className="w-3 h-3" />
                    Active Telemetry
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {user.id.slice(0, 8)}...</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Observatory,{' '}
                  <span className="text-gradient-cosmic">@{user.githubUsername}</span>
                </h1>
                <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed" style={{ fontWeight: 350 }}>
                  Every commit lights an isotropic 3D star. Maintain consistency to weave shining constellations.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/u/${user.githubUsername}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-xs transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
                <Compass className="w-4 h-4" />
                <span>Enter 3D Galaxy</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => copyToClipboard(galaxyProfileUrl, 'galaxyUrl')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}>
                {copiedField === 'galaxyUrl' ? (
                  <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                ) : (
                  <><Copy className="w-3.5 h-3.5 text-slate-400" /><span>Share Profile</span></>
                )}
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 4px 20px ${card.glow}`,
              }}>
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-50 transition-opacity group-hover:opacity-100"
                style={{ background: `radial-gradient(circle, ${card.color}30 0%, transparent 70%)`, filter: 'blur(20px)' }} />
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{card.label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}15`, border: `1px solid ${card.color}30`, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: card.valueColor }}>{card.value}</span>
                <span className="text-xs text-slate-500">{card.unit}</span>
              </div>
              {(card as { hasProgress?: boolean }).hasProgress && (
                <div className="mt-3">
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${streakProgressPercent}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
                  </div>
                  <p className="mt-1.5 text-[10px] flex justify-between font-mono" style={{ color: card.subColor }}>
                    <span>{card.subtext}</span>
                    <span>{streakProgressPercent}%</span>
                  </p>
                </div>
              )}
              {!(card as { hasProgress?: boolean }).hasProgress && (
                <p className="mt-2.5 text-[11px] font-mono" style={{ color: card.subColor }}>{card.subtext}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Celestial Operations Tabs ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-3xl p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5 mb-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Layers className="w-4 h-4 text-violet-400" />
                  </div>
                  Celestial Operations
                </h2>
                <p className="text-xs text-slate-500 mt-1">Manage repositories, webhooks, constellations, and spectral models.</p>
              </div>
              <TabsList className="p-1 rounded-2xl gap-0.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { value: 'clusters', label: `Star Clusters (${projects.length})` },
                  { value: 'webhook', label: 'Webhook Setup' },
                  { value: 'badge', label: 'README Badge' },
                  { value: 'constellations', label: `Constellations (${constellations.length})` },
                  { value: 'spectrals', label: 'Spectral Engine' },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="text-xs font-medium rounded-xl px-3 py-1.5 transition-all data-[state=active]:text-white data-[state=active]:shadow-lg"
                    style={{ ['--tab-active-bg' as string]: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}
                    data-active={activeTab === tab.value}
                    onMouseEnter={() => {}}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* TAB 1: Star Clusters */}
            <TabsContent value="clusters" className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">{projects.length}</span> connected {projects.length === 1 ? 'cluster' : 'clusters'} in your cosmos
                </div>
                <div className="flex items-center gap-3">
                  {syncStatus && (
                    <span className="text-[11px] font-mono text-cyan-300">{syncStatus}</span>
                  )}
                  <button
                    onClick={handleSyncRepos}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 2px 10px rgba(124,58,237,0.3)' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Repositories'}</span>
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl p-10 text-center"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.3)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 30px rgba(139,92,246,0.2)' }}>
                    <FolderGit2 className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Star Clusters Connected Yet</h3>
                  <p className="text-sm text-slate-400 max-w-lg mx-auto mb-7 leading-relaxed">
                    CommitCosmos turns every GitHub repository into a distinct star cluster in your 3D universe. Add a webhook to automatically ingest commits and light up your galaxy.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button onClick={() => setActiveTab('webhook')}
                      className="text-white text-xs font-bold px-6 py-2.5 rounded-2xl transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 8px 30px rgba(124,58,237,0.4)', border: 'none' }}>
                      <Zap className="w-3.5 h-3.5 mr-2" />
                      Setup GitHub Webhook (60s)
                    </Button>
                    <a href="https://github.com/new" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-slate-300 text-xs font-medium transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      Create New Repo
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((proj, i) => (
                    <motion.div key={proj.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(139,92,246,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                              <FolderGit2 className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-sm group-hover:text-violet-300 transition-colors">{proj.repoName}</h4>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {proj.id.slice(0, 8)}</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Live Synced
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-mono">{proj.repoUrl}</p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span suppressHydrationWarning className="text-[11px] text-slate-600">Connected {new Date(proj.createdAt).toLocaleDateString()}</span>
                        <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                          Open Repo <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Webhook Setup */}
            <TabsContent value="webhook" className="pt-4">
              <div className="space-y-5">
                <div className="p-4 rounded-2xl flex items-start gap-3.5"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white font-semibold block mb-0.5">Defensive Ingestion Architecture</strong>
                    Payloads are verified with <strong className="text-violet-300">HMAC-SHA256</strong> signatures + <strong className="text-cyan-300">Upstash Redis</strong> sliding-window rate limiting (100 req/60s).
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: '1. Webhook Payload URL', value: webhookPayloadUrl, field: 'payloadUrl', color: '#22d3ee' },
                    { label: '2. Webhook Secret (HMAC-SHA256)', value: webhookSecret, field: 'secret', color: '#fbbf24' },
                  ].map(({ label, value, field, color }) => (
                    <div key={field} className="p-4 rounded-2xl flex flex-col justify-between"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                        <p className="text-xs font-mono p-3 rounded-xl break-all select-all"
                          style={{ color, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {value}
                        </p>
                      </div>
                      <button onClick={() => copyToClipboard(value, field)}
                        className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-xs transition-all hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                        {copiedField === field ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 text-slate-400" /><span>Copy {field === 'payloadUrl' ? 'Payload URL' : 'Secret'}</span></>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    How to Add to GitHub Repository
                  </h4>
                  <ol className="space-y-3 text-xs text-slate-400 leading-relaxed">
                    {[
                      'Open your repository on GitHub → navigate to Settings → Webhooks → click "Add webhook".',
                      'Paste the Payload URL and Secret. Set Content type to application/json.',
                      'Select "Just the push event", ensure Active is checked, then click "Add webhook".',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                          {i + 1}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: step.replace(/Settings|Webhooks|Add webhook|Content type|application\/json|Just the push event|Active/g, m => `<strong class="text-slate-200">${m}</strong>`) }} />
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 font-semibold block mb-2">⚡ Quick Test — Fire an ignition commit:</span>
                    <div className="flex items-center justify-between gap-2 p-3 rounded-xl font-mono text-[11px]"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                      <span className="truncate">git commit --allow-empty -m &quot;✨ Ignite CommitCosmos star&quot; &amp;&amp; git push</span>
                      <button onClick={() => copyToClipboard('git commit --allow-empty -m "✨ Ignite CommitCosmos star" && git push', 'gitCommand')}
                        className="text-slate-400 hover:text-white p-1 transition-colors flex-shrink-0">
                        {copiedField === 'gitCommand' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: README Badge */}
            <TabsContent value="badge" className="pt-4">
              <div className="space-y-5">
                <div className="p-4 rounded-2xl flex items-start gap-3.5"
                  style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <Star className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white font-semibold block mb-0.5">Embed in your GitHub Profile or Repository README</strong>
                    Showcase your commit streak and ignited stars with an auto-updating live SVG badge.
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="p-6 rounded-2xl text-center flex flex-col items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Live Badge Preview</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/badge/${user.githubUsername}`}
                    alt={`CommitCosmos badge for ${user.githubUsername}`}
                    className="h-9 w-auto max-w-full"
                  />
                </div>

                {/* Code Snippets */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-300">Markdown Snippet (for README.md)</span>
                      <button
                        onClick={() => copyToClipboard(`[![CommitCosmos](${productionUrl}/api/badge/${user.githubUsername})](${productionUrl}/u/${user.githubUsername})`, 'badgeMarkdown')}
                        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        {copiedField === 'badgeMarkdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'badgeMarkdown' ? 'Copied!' : 'Copy Markdown'}</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono p-3 rounded-xl break-all select-all text-slate-300"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {`[![CommitCosmos](${productionUrl}/api/badge/${user.githubUsername})](${productionUrl}/u/${user.githubUsername})`}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-300">Direct SVG URL</span>
                      <button
                        onClick={() => copyToClipboard(`${productionUrl}/api/badge/${user.githubUsername}`, 'badgeUrl')}
                        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        {copiedField === 'badgeUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'badgeUrl' ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono p-3 rounded-xl break-all select-all text-cyan-300"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {`${productionUrl}/api/badge/${user.githubUsername}`}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: Constellations */}
            <TabsContent value="constellations" className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {constellationMilestones.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="p-5 rounded-2xl transition-all"
                    style={{
                      background: c.unlocked ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
                      border: c.unlocked ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: c.unlocked ? '0 8px 30px rgba(139,92,246,0.15)' : 'none',
                      opacity: c.unlocked ? 1 : 0.6,
                    }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.icon}</span>
                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={c.unlocked
                          ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#475569' }}>
                        {c.unlocked ? '✓ Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3 leading-relaxed">{c.description}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono"
                      style={{ color: c.unlocked ? '#a78bfa' : '#475569' }}>
                      <span>Requirement:</span>
                      <span className="font-semibold">{c.streak}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 4: Spectral Engine */}
            <TabsContent value="spectrals" className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {spectralClasses.map((s) => (
                  <div key={s.name} className="p-4 rounded-2xl flex items-center justify-between gap-3 transition-all group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${s.code}40`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: s.code, boxShadow: `0 0 16px ${s.code}80` }} />
                      <div>
                        <span className="text-sm font-bold text-white block">{s.lang}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.classType}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
                      style={{ color: s.code, background: `${s.code}15`, border: `1px solid ${s.code}30` }}>
                      {s.code}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ── Live Commit Stream ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}
          className="rounded-3xl p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <Star className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Stellar Ingestion Stream</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time commits via verified webhook endpoint.</p>
              </div>
            </div>
            <Link href={`/u/${user.githubUsername}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              View in Galaxy <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCommits.length === 0 ? (
            <div className="py-10 text-center rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-xs text-slate-500">No commits yet. Push your first commit to ignite a star!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCommits.slice(0, 8).map((commit, i) => (
                <motion.div key={commit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}>
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.7)' }} />
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {commit.message || 'No commit message'}
                    </span>
                    {commit.language && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                        {commit.language}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                      {commit.sha.slice(0, 7)}
                    </span>
                    <span suppressHydrationWarning>{new Date(commit.committedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
