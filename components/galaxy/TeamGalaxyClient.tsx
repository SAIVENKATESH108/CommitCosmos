'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GalaxyListView } from '@/components/galaxy/GalaxyListView';
import { useGalaxyStore } from '@/lib/store';
import type { TeamGalaxyData, GalaxyData } from '@/lib/queries';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  Layers,
  ArrowLeft,
} from 'lucide-react';

const GalaxyScene = dynamic(
  () => import('@/components/galaxy/GalaxyScene').then((mod) => mod.GalaxyScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-black text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium tracking-wide">Igniting team star system...</p>
      </div>
    ),
  }
);

interface TeamGalaxyClientProps {
  teamId: string;
  sessionUser?: {
    id?: string;
    githubUsername?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function TeamGalaxyClient({ teamId, sessionUser: _sessionUser }: TeamGalaxyClientProps) {
  const queryClient = useQueryClient();
  const { isAccessibilityListView, setAccessibilityListView } = useGalaxyStore();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Team Galaxy Data
  const { data: teamData, isLoading, isError, error } = useQuery<TeamGalaxyData & { isTeamMode: boolean }>({
    queryKey: ['team-galaxy', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${encodeURIComponent(teamId)}/galaxy`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load team galaxy');
      }
      return res.json();
    },
    refetchInterval: 20000,
  });

  // Invite collaborator handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;

    setIsInviting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUsername: inviteUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add collaborator');
      }

      toast.success(`Added @${inviteUsername} to the team star system!`);
      setInviteUsername('');
      queryClient.invalidateQueries({ queryKey: ['team-galaxy', teamId] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inviting member';
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/t/${teamId}?invite=${teamData?.team.inviteCode || ''}`
      : '';
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success('Shareable team invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Bridge TeamGalaxyData to GalaxyData for GalaxyListView
  const bridgedGalaxy: GalaxyData | null = useMemo(() => {
    if (!teamData) return null;
    return {
      user: {
        id: teamData.team.id,
        githubUsername: teamData.team.name,
        avatarUrl: null,
      },
      projects: teamData.projects,
      branches: teamData.branches || [],
      releases: teamData.releases || [],
      commits: teamData.commits,
      streak: null,
      constellations: [],
      totalStars: teamData.totalStars,
    };
  }, [teamData]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-slate-400 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-medium tracking-wide">Initializing multi-author team system...</p>
      </div>
    );
  }

  if (isError || !teamData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-slate-200 px-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Team Star System Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error?.message || 'Could not load team telemetry.'}</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Return to Celestial Void
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col relative overflow-hidden">
      {/* 1. Persistent Top Team Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cosmos</span>
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h1 className="text-sm font-bold text-white tracking-tight">{teamData.team.name}</h1>
              <Badge variant="outline" className="text-[10px] bg-indigo-950/60 text-indigo-300 border-indigo-500/30">
                Multi-Author System
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Member Roster Avatar Chips with Chromatic Orbital Dots */}
            <div className="hidden md:flex items-center -space-x-1.5">
              {teamData.members.map((member) => (
                <div
                  key={member.userId}
                  className="relative group"
                  title={`@${member.githubUsername} (${member.role})`}
                >
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.githubUsername}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full ring-2 border border-black"
                      style={{ borderColor: member.color }}
                      unoptimized
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.githubUsername.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-black"
                    style={{ backgroundColor: member.color }}
                  />
                </div>
              ))}
            </div>

            {/* Invite Collaborator Button */}
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>

            {/* View Mode Toggle: 3D Celestial vs 2D List */}
            <button
              type="button"
              onClick={() => setAccessibilityListView(!isAccessibilityListView)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label={isAccessibilityListView ? 'Switch to 3D View' : 'Switch to Accessible List View'}
            >
              {isAccessibilityListView ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D View</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>List View</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Modality Rendering: 3D Multi-Author Star System or Accessible List View */}
      <main className="flex-1 relative w-full h-[calc(100vh-56px)]">
        {isAccessibilityListView && bridgedGalaxy ? (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6">
            <GalaxyListView galaxy={bridgedGalaxy} isTeamMode={true} />
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* 3D WebGL Canvas */}
            <GalaxyScene
              commits={teamData.commits}
              projects={teamData.projects}
              branches={teamData.branches}
              releases={teamData.releases}
              username={teamData.team.name}
            />

            {/* Floating Top-Right Team Metrics Card */}
            <aside className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-auto">
              <Card className="w-72 sm:w-80 bg-slate-950/85 border-slate-800/80 backdrop-blur-md shadow-2xl text-slate-200">
                <CardHeader className="p-4 pb-2 border-b border-slate-800/60 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Team Orbitals</span>
                  </CardTitle>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live 20s
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Stars</div>
                      <div className="text-lg font-bold text-white font-mono">{teamData.totalStars}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Collaborators</div>
                      <div className="text-lg font-bold text-cyan-400 font-mono">{teamData.members.length}</div>
                    </div>
                  </div>

                  {/* Contributor Chromatic Legend */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                    <div className="text-[11px] font-semibold text-slate-300">Author Color Map</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {teamData.members.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: member.color }}
                            />
                            <span className="text-slate-300 truncate font-mono">@{member.githubUsername}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 capitalize">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>

      {/* 3. Team Invite Dialog Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Invite Collaborator to Star System</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Add by GitHub Username */}
              <form onSubmit={handleInvite} className="space-y-3">
                <label htmlFor="invite-username" className="text-xs text-slate-300 font-medium block">
                  Add by GitHub Username
                </label>
                <div className="flex gap-2">
                  <input
                    id="invite-username"
                    type="text"
                    placeholder="e.g. octocat"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={isInviting || !inviteUsername.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    {isInviting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>

              {/* Shareable Invite Link */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 font-medium block">Shareable Invite Link</span>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">
                    /t/{teamId}?invite={teamData.team.inviteCode || 'cosmos'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Copy invite link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
