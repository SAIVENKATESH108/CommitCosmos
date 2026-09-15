'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, GitCommit, Flame, FolderGit2, ChevronDown, ChevronRight, ExternalLink, Calendar, Code } from 'lucide-react';
import type { GalaxyData, UserStatsData, GalaxyCommit, GalaxyProject } from '@/lib/queries';

interface GalaxyListViewProps {
  galaxy: GalaxyData;
  stats?: UserStatsData | null;
}

/**
 * ==============================================================================
 * Accessible 2D Galaxy List View Component
 * ==============================================================================
 * WCAG 2.1 AA Compliant Fallback for Screen Readers & Motion Sensitivity:
 *
 * - Real, semantic HTML <table> with proper <caption>, <thead>, and <th scope="col">
 * - Expandable repository rows with keyboard-navigable buttons (aria-expanded, aria-controls)
 * - Contrast ratios exceeding 4.5:1 (WCAG AA) for all text on dark slate backgrounds
 * - Displays the exact same server state metrics (username, total commits, streaks, projects)
 *   as the 3D scene, ensuring visual and cognitive parity across modalities.
 * ==============================================================================
 */
export function GalaxyListView({ galaxy, stats }: GalaxyListViewProps) {
  // Set of expanded project IDs for commit details
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Group commits by repository ID
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      {/* 1. Header & Synchronized Stats Card */}
      <section aria-labelledby="stats-summary-heading">
        <h2 id="stats-summary-heading" className="sr-only">
          Account Overview and Activity Metrics
        </h2>

        <Card className="bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-md">
          <CardHeader className="p-5 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                {galaxy.user.avatarUrl ? (
                  <Image
                    src={galaxy.user.avatarUrl}
                    alt={`${galaxy.user.githubUsername}'s profile avatar`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full ring-2 ring-indigo-500/50"
                    unoptimized
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-12 h-12 rounded-full bg-indigo-900/70 border border-indigo-500/40 flex items-center justify-center text-indigo-200 font-bold text-lg"
                  >
                    {galaxy.user.githubUsername.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      @{galaxy.user.githubUsername}
                    </h1>
                    <Badge variant="outline" className="text-xs bg-indigo-950/70 text-indigo-300 border-indigo-800">
                      Accessible View
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Structured tabular commit and repository telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  Live Sync (20s)
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Stars / Commits */}
            <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="p-2 rounded-md bg-amber-500/10 text-amber-300" aria-hidden="true">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Total Stars (Commits)</span>
                <span className="text-lg font-bold text-white">{totalCommits}</span>
              </div>
            </div>

            {/* Daily Streak */}
            <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="p-2 rounded-md bg-orange-500/10 text-orange-300" aria-hidden="true">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Current Daily Streak</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-white">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
                  <span className="text-xs text-slate-400">(Best: {longestStreak}d)</span>
                </div>
              </div>
            </div>

            {/* Constellation Clusters / Repos */}
            <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-300" aria-hidden="true">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">Connected Projects</span>
                <span className="text-lg font-bold text-white">{projectCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. Semantic Accessible Table */}
      <section aria-labelledby="repositories-table-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="repositories-table-heading" className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            Connected Repositories and Commit History
          </h2>
          <span className="text-xs text-slate-400">
            {galaxy.projects.length} {galaxy.projects.length === 1 ? 'repository' : 'repositories'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
          <table className="w-full text-left border-collapse" aria-describedby="repositories-table-heading">
            <caption className="sr-only">
              List of connected GitHub repositories for @{galaxy.user.githubUsername}, including total commits and expandable commit details.
            </caption>

            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <th scope="col" className="py-3.5 px-4 w-12 text-center">
                  <span className="sr-only">Toggle details</span>
                </th>
                <th scope="col" className="py-3.5 px-4">
                  Repository Name
                </th>
                <th scope="col" className="py-3.5 px-4">
                  GitHub URL
                </th>
                <th scope="col" className="py-3.5 px-4 text-right">
                  Commits (Stars)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-sm">
              {galaxy.projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No repositories connected yet. Push a commit to illuminate this table.
                  </td>
                </tr>
              ) : (
                galaxy.projects.map((project: GalaxyProject) => {
                  const projectCommits = commitsByProject.get(project.id) || [];
                  const isExpanded = expandedProjects.has(project.id);
                  const rowId = `repo-details-${project.id}`;

                  return (
                    <React.Fragment key={project.id}>
                      <tr className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProject(project.id)}
                            aria-expanded={isExpanded}
                            aria-controls={rowId}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} commit details for repository ${project.repoName}`}
                            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 font-medium text-white">
                          <span className="flex items-center space-x-2">
                            <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                            <span>{project.repoName}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit repository ${project.repoName} on GitHub (opens in new tab)`}
                            className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm"
                          >
                            <span className="truncate max-w-xs">{project.repoUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          </a>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700 font-mono">
                            {projectCommits.length}
                          </Badge>
                        </td>
                      </tr>

                      {/* Expandable Per-Commit Nested Table / List */}
                      {isExpanded && (
                        <tr id={rowId} className="bg-slate-950/90">
                          <td colSpan={4} className="py-4 px-6 border-t border-slate-800/80">
                            <div className="space-y-3">
                              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                                <GitCommit className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                                <span>Recent Commits in {project.repoName}</span>
                              </h3>

                              {projectCommits.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No commits recorded in this repository.</p>
                              ) : (
                                <ul className="space-y-2" aria-label={`Commits for ${project.repoName}`}>
                                  {projectCommits.map((commit) => (
                                    <li
                                      key={commit.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs gap-2"
                                    >
                                      <div className="flex items-start sm:items-center space-x-2">
                                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px] shrink-0">
                                          {commit.sha.slice(0, 7)}
                                        </code>
                                        <span className="text-slate-200 font-medium break-all">
                                          {commit.message || 'No commit message'}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-3 text-slate-400 shrink-0">
                                        {commit.language && (
                                          <span className="flex items-center space-x-1 text-slate-300">
                                            <Code className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                                            <span>{commit.language}</span>
                                          </span>
                                        )}
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3 text-slate-500" aria-hidden="true" />
                                          <time dateTime={commit.committedAt}>
                                            {new Date(commit.committedAt).toLocaleDateString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                            })}
                                          </time>
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
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
