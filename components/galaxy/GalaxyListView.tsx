'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Sparkles, GitCommit, Flame, FolderGit2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { GalaxyData, UserStatsData, GalaxyCommit, GalaxyProject } from '@/lib/queries';

interface GalaxyListViewProps {
  galaxy: GalaxyData;
  stats?: UserStatsData | null;
  isTeamMode?: boolean;
}

/**
 * ==============================================================================
 * Accessible 2D Galaxy List View Component — Redesigned
 * ==============================================================================
 * WCAG 2.1 AA Compliant Fallback for Screen Readers & Motion Sensitivity
 * ==============================================================================
 */
export function GalaxyListView({ galaxy, stats, isTeamMode = false }: GalaxyListViewProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const isMultiAuthor = isTeamMode || galaxy.commits.some((c) => Boolean(c.authorUsername));

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const commitsByProject = useMemo(() => {
    const map = new Map<string, GalaxyCommit[]>();
    galaxy.commits.forEach((commit) => {
      const list = map.get(commit.projectId) || [];
      list.push(commit);
      map.set(commit.projectId, list);
    });
    return map;
  }, [galaxy.commits]);

  const totalCommits = stats?.totalCommits ?? galaxy.totalStars ?? galaxy.commits.length;
  const currentStreak = stats?.currentStreak ?? galaxy.streak?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? galaxy.streak?.longestStreak ?? 0;
  const projectCount = stats?.totalProjects ?? galaxy.projects.length;

  const metricChips = [
    { label: 'Total Stars (Commits)', value: totalCommits, icon: <GitCommit className="w-5 h-5" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', glow: 'rgba(245,158,11,0.15)' },
    { label: 'Current Daily Streak', value: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`, sub: `Best: ${longestStreak}d`, icon: <Flame className="w-5 h-5" />, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', glow: 'rgba(249,115,22,0.15)' },
    { label: 'Connected Projects', value: projectCount, icon: <FolderGit2 className="w-5 h-5" />, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', glow: 'rgba(167,139,250,0.15)' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-100">

      {/* ── Profile Header Card ── */}
      <section aria-labelledby="stats-summary-heading">
        <h2 id="stats-summary-heading" className="sr-only">Account Overview and Activity Metrics</h2>

        <div className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(109,40,217,0.15)' }}>
          {/* Gradient top border */}
          <div className="h-[1px] w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), rgba(6,182,212,0.5), transparent)' }} />

          <div className="p-6 sm:p-8">
            {/* User identity row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-6">
              <div className="flex items-center space-x-4">
                {galaxy.user.avatarUrl ? (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full animate-glow-pulse"
                      style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)', filter: 'blur(8px)' }} />
                    <Image src={galaxy.user.avatarUrl} alt={`${galaxy.user.githubUsername}'s avatar`}
                      width={56} height={56} className="relative w-14 h-14 rounded-full object-cover"
                      style={{ border: '2px solid rgba(139,92,246,0.5)' }} unoptimized />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                    {galaxy.user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-black text-white tracking-tight">@{galaxy.user.githubUsername}</h1>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                      Accessible View
                    </span>
                  </div>
                  <p className="text-sm text-slate-500" style={{ fontWeight: 350 }}>Structured tabular commit and repository telemetry</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', boxShadow: '0 0 12px rgba(52,211,153,0.15)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
                  Live Sync (20s)
                </span>
              </div>
            </div>

            {/* Metric chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {metricChips.map(({ label, value, sub, icon, color, bg, border, glow }) => (
                <div key={label} className="flex items-center space-x-4 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 4px 20px ${glow}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30`, color, boxShadow: `0 0 16px ${color}40` }}>
                    {icon}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-0.5">{label}</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xl font-black text-white">{value}</span>
                      {sub && <span className="text-xs text-slate-500">({sub})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Repository Table ── */}
      <section aria-labelledby="repositories-table-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="repositories-table-heading" className="text-lg font-bold text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Sparkles className="w-4 h-4 text-violet-400" aria-hidden="true" />
            </div>
            Connected Repositories & Commit History
          </h2>
          <span className="text-xs px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#94a3b8' }}>
            {galaxy.projects.length} {galaxy.projects.length === 1 ? 'repository' : 'repositories'}
          </span>
        </div>

        {galaxy.commits.length === 0 && (
          <div className="p-8 rounded-2xl text-center"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.3)' }}>
            <div className="inline-flex p-4 rounded-2xl mb-4"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <Sparkles className="w-7 h-7 text-violet-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your galaxy is waiting for its first star</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto" style={{ fontWeight: 350 }}>
              Push a commit to a connected repository to illuminate this table with your first stellar data.
            </p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <table className="w-full text-left border-collapse" aria-describedby="repositories-table-heading">
            <caption className="sr-only">
              Connected GitHub repositories for @{galaxy.user.githubUsername} with commit history.
            </caption>
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-widest"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                <th scope="col" className="py-4 px-4 w-12 text-center"><span className="sr-only">Toggle details</span></th>
                <th scope="col" className="py-4 px-4 text-slate-400">Repository Name</th>
                <th scope="col" className="py-4 px-4 text-slate-400">GitHub URL</th>
                <th scope="col" className="py-4 px-4 text-right text-slate-400">Commits (Stars)</th>
              </tr>
            </thead>
            <tbody>
              {galaxy.projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    No repositories connected yet.
                  </td>
                </tr>
              ) : (
                galaxy.projects.map((project: GalaxyProject) => {
                  const projectCommits = commitsByProject.get(project.id) || [];
                  const isExpanded = expandedProjects.has(project.id);
                  const rowId = `repo-details-${project.id}`;

                  return (
                    <React.Fragment key={project.id}>
                      <tr className="transition-all group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td className="py-4 px-4 text-center">
                          <button type="button" onClick={() => toggleProject(project.id)}
                            aria-expanded={isExpanded} aria-controls={rowId}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} commits for ${project.repoName}`}
                            className="p-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            style={{ color: '#64748b' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.15)'; (e.currentTarget as HTMLElement).style.color = '#a78bfa'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4" aria-hidden="true" />
                              : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <span className="flex items-center space-x-2.5">
                            <FolderGit2 className="w-4 h-4 flex-shrink-0" style={{ color: '#8b5cf6' }} aria-hidden="true" />
                            <span className="font-semibold text-white group-hover:text-violet-300 transition-colors text-sm">{project.repoName}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                            aria-label={`Visit ${project.repoName} on GitHub`}
                            className="inline-flex items-center space-x-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-sm transition-colors"
                            style={{ color: '#818cf8' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a78bfa'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}>
                            <span className="truncate max-w-xs">{project.repoUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          </a>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black"
                            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                            {projectCommits.length}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable commit details */}
                      {isExpanded && (
                        <tr id={rowId} style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <td colSpan={4} className="py-5 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="space-y-3">
                              <h3 className="text-xs font-bold uppercase tracking-widest flex items-center space-x-2" style={{ color: '#f59e0b' }}>
                                <GitCommit className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Recent Commits in {project.repoName}</span>
                              </h3>

                              {projectCommits.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No commits recorded in this repository.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-xl"
                                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                                  <table className="w-full text-left border-collapse text-xs">
                                    <caption className="sr-only">Recent commits for {project.repoName}</caption>
                                    <thead>
                                      <tr className="text-[10px] font-bold uppercase tracking-widest"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#475569' }}>
                                        <th scope="col" className="py-3 px-4 w-24">SHA</th>
                                        <th scope="col" className="py-3 px-4">Message</th>
                                        {isMultiAuthor && <th scope="col" className="py-3 px-4 w-36">Author</th>}
                                        <th scope="col" className="py-3 px-4 w-28">Language</th>
                                        <th scope="col" className="py-3 px-4 w-32 text-right">Date</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {projectCommits.map((commit) => (
                                        <tr key={commit.id} className="transition-colors"
                                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                          <td className="py-2.5 px-4 font-mono font-semibold" style={{ color: '#a78bfa' }}>
                                            {commit.sha.slice(0, 7)}
                                          </td>
                                          <td className="py-2.5 px-4 font-medium text-slate-200">{commit.message || 'No commit message'}</td>
                                          {isMultiAuthor && (
                                            <td className="py-2.5 px-4">
                                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold font-mono"
                                                style={{
                                                  backgroundColor: commit.authorColor ? `${commit.authorColor}18` : 'rgba(99,102,241,0.12)',
                                                  borderColor: commit.authorColor ? `${commit.authorColor}35` : 'rgba(99,102,241,0.25)',
                                                  border: '1px solid',
                                                  color: commit.authorColor || '#818cf8',
                                                }}>
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: commit.authorColor || '#818cf8' }} aria-hidden="true" />
                                                @{commit.authorUsername || 'collaborator'}
                                              </span>
                                            </td>
                                          )}
                                          <td className="py-2.5 px-4">
                                            {commit.language ? (
                                              <Badge variant="outline" className="text-[10px] font-mono" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#64748b' }}>
                                                {commit.language}
                                              </Badge>
                                            ) : <span className="text-slate-600">—</span>}
                                          </td>
                                          <td className="py-2.5 px-4 text-right" style={{ color: '#475569' }}>
                                            <time dateTime={commit.committedAt} suppressHydrationWarning>
                                              {new Date(commit.committedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </time>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export default GalaxyListView;
