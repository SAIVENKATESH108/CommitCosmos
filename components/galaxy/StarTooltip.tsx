'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, GitCommit, Calendar, FolderGit2, Hash, GitMerge, Sparkles, GitBranch, GitPullRequest, User } from 'lucide-react';
import { useGalaxyStore } from '@/lib/store';
import type { GalaxyCommit, GalaxyProject, GalaxyBranch } from '@/lib/queries';

interface StarTooltipProps {
  commits: GalaxyCommit[];
  projects: GalaxyProject[];
  branches?: GalaxyBranch[];
}

/**
 * ==============================================================================
 * StarTooltip — Fixed-Position HUD Card
 * ==============================================================================
 * Rendered as a sibling OUTSIDE the R3F <Canvas> so it is a normal DOM element,
 * not a Three.js object. This avoids per-frame 3D→2D screen-space projection
 * math that would be needed to track a star's position on screen.
 *
 * Interaction model:
 *  - HOVER (desktop):  hoveredStarId drives a preview; card appears without close button
 *  - CLICK/TAP (all):  pinnedStarId drives the persistent card with a close button
 *  - "Active" star:    pinnedStarId takes priority over hoveredStarId
 *  - Dismiss:          clicking the X button, or clicking the canvas void
 *                      (GalaxyScene calls setPinnedStarId(null) on onPointerMissed)
 *
 * Positioning:
 *  - Bottom-left corner on desktop (avoids covering the top-right Celestial Metrics card)
 *  - Bottom full-width on mobile (sm:w-80, sm:left-auto sm:bottom-6 sm:left-6)
 * ==============================================================================
 */
export function StarTooltip({ commits, projects, branches }: StarTooltipProps) {
  const { selectedStarId, pinnedStarId, setPinnedStarId, setHoveredStarId, setSelectedStarId } =
    useGalaxyStore();

  // selectedStarId in the store already has pinned-takes-priority-over-hovered logic built in
  // Build lookup maps from the arrays passed in
  const commitMap = React.useMemo(
    () => new Map(commits.map((c) => [c.id, c])),
    [commits]
  );
  const projectMap = React.useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const branchMap = React.useMemo(
    () => new Map((branches || []).map((b) => [b.id, b])),
    [branches]
  );

  const activeId = selectedStarId;
  const isPinned = Boolean(pinnedStarId);

  const activeCommit = activeId ? commitMap.get(activeId) : undefined;
  const activeProject = activeCommit ? projectMap.get(activeCommit.projectId) : undefined;
  const activeBranch = activeCommit?.branchId ? branchMap.get(activeCommit.branchId) : undefined;

  const dismiss = useCallback(() => {
    setPinnedStarId(null);
    setHoveredStarId(null);
    setSelectedStarId(null);
  }, [setPinnedStarId, setHoveredStarId, setSelectedStarId]);

  // Escape key closes pinned or hovered star details
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  /**
   * Format a raw ISO date string into a human-friendly form.
   * Falls back gracefully if the string is null/unparseable.
   */
  const formatDate = (iso: string | null | undefined): string => {
    if (!iso) return 'Unknown date';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  /**
   * Build the GitHub commit URL from the project's repoUrl and commit SHA.
   * GitHub canonical form: https://github.com/owner/repo/commit/<sha>
   */
  const buildCommitUrl = (project: GalaxyProject | undefined, sha: string): string | null => {
    if (!project?.repoUrl) return null;
    // Normalise trailing slash
    const base = project.repoUrl.replace(/\/$/, '');
    return `${base}/commit/${sha}`;
  };

  /** Truncate long commit messages to avoid overflowing the card */
  const truncateMessage = (msg: string | null | undefined, maxLen = 120): string => {
    if (!msg) return 'No commit message';
    return msg.length > maxLen ? msg.slice(0, maxLen).trimEnd() + '…' : msg;
  };

  const isProtostar = activeId === 'protostar';

  return (
    <AnimatePresence>
      {isProtostar && (
        <motion.aside
          key="protostar-tooltip"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          aria-label="Protostar core details"
          aria-live="polite"
          className="fixed z-50 pointer-events-auto bottom-0 left-0 right-0 sm:bottom-6 sm:left-6 sm:right-auto w-full sm:w-80 max-w-full sm:max-w-sm bg-black/85 backdrop-blur-xl border border-indigo-500/30 rounded-none sm:rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-80" />
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-indigo-300">Stellar Nursery</span>
              </div>
              {isPinned && (
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close protostar details"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-white font-medium">
              Dormant Protostar Core
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your galaxy is waiting for its first star — push a commit to begin.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
              <span>Classification:</span>
              <span className="font-mono text-indigo-300 font-semibold">Class 0 (Embryonic)</span>
            </div>
          </div>
        </motion.aside>
      )}

      {activeCommit && (
        <motion.aside
          key={activeId}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          aria-label="Commit star details"
          aria-live="polite"
          className={[
            // Positioning: fixed to viewport, bottom-left on desktop, bottom-full-width on mobile
            'fixed z-50 pointer-events-auto',
            'bottom-0 left-0 right-0',              // mobile: full width bottom
            'sm:bottom-6 sm:left-6 sm:right-auto',  // desktop: bottom-left corner
            // Sizing
            'w-full sm:w-80 max-w-full sm:max-w-sm',
            // Glassmorphic card
            'bg-black/80 backdrop-blur-xl',
            'border border-white/10',
            'rounded-none sm:rounded-2xl',
            'shadow-2xl shadow-black/60',
            'overflow-hidden',
          ].join(' ')}
        >
          {/* Accent top-border: colour matches the star's spectral colour */}
          <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 opacity-80" />

          <div className="p-4 sm:p-5 space-y-3.5">
            {/* Header row: repo name + optional close button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400"
                  aria-hidden="true"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-indigo-300 truncate" title={activeProject?.repoName}>
                  {activeProject?.repoName ?? 'Unknown repo'}
                </span>
              </div>

              {/* Close button — only shown when a star is pinned (clicked/tapped) */}
              {isPinned && (
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Close commit details"
                  className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Commit message or PR Merge header */}
            {activeCommit.isPrMerge ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-500/25 via-indigo-500/20 to-cyan-500/25 text-purple-200 border border-purple-400/40 shadow-sm font-mono">
                    <GitPullRequest className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                    {activeCommit.prNumber ? `Merged via PR #${activeCommit.prNumber}` : 'Merged via Pull Request'}
                  </span>
                </div>
                {activeCommit.message && (
                  <p className="text-xs text-slate-300 leading-snug font-normal">
                    {truncateMessage(activeCommit.message)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white leading-snug font-medium">
                {truncateMessage(activeCommit.message)}
              </p>
            )}

            <div className="space-y-2">
              {/* Short SHA + GitHub link */}
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                {buildCommitUrl(activeProject, activeCommit.sha) ? (
                  <a
                    href={buildCommitUrl(activeProject, activeCommit.sha)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                    aria-label={`View commit ${activeCommit.sha.slice(0, 7)} on GitHub`}
                  >
                    {activeCommit.sha.slice(0, 7)}
                    <ExternalLink className="w-3 h-3 opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="font-mono text-xs text-slate-400">
                    {activeCommit.sha.slice(0, 7)}
                  </span>
                )}
              </div>

              {/* Commit date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                <time
                  dateTime={activeCommit.committedAt}
                  className="text-xs text-slate-400"
                >
                  {formatDate(activeCommit.committedAt)}
                </time>
              </div>

              {/* Language tag (optional) */}
              {activeCommit.language && (
                <div className="flex items-center gap-2">
                  <GitCommit className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-slate-400">
                    {activeCommit.language}
                  </span>
                </div>
              )}

              {/* Branch indicator */}
              {activeBranch && (
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                    {activeBranch.branchName}
                    {activeBranch.mergedAt ? ' · merged' : ' · branch moon'}
                  </span>
                </div>
              )}

              {/* Author badge (multi-author / team mode) */}
              {activeCommit.authorUsername && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Author:</span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-semibold border"
                      style={{
                        backgroundColor: activeCommit.authorColor ? `${activeCommit.authorColor}20` : 'rgba(99, 102, 241, 0.15)',
                        borderColor: activeCommit.authorColor ? `${activeCommit.authorColor}50` : 'rgba(99, 102, 241, 0.3)',
                        color: activeCommit.authorColor || '#818cf8',
                      }}
                    >
                      @{activeCommit.authorUsername}
                    </span>
                  </div>
                </div>
              )}

              {/* Visual Hierarchy: Magnitude / Impact Badge */}
              {activeCommit.isPrMerge ? (
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/40">
                    Dual-Star Accretion System · PR {activeCommit.prNumber ? `#${activeCommit.prNumber}` : 'Merge'}
                  </span>
                </div>
              ) : activeCommit.message?.toLowerCase().startsWith('merge') ? (
                <div className="flex items-center gap-2">
                  <GitMerge className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Merge commit · Supergiant Star
                  </span>
                </div>
              ) : activeCommit.magnitude ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-400">Magnitude:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      +{activeCommit.magnitude} blast radius
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-slate-400">
                    Magnitude: <span className="font-mono text-slate-300">Standard star</span>
                  </span>
                </div>
              )}
            </div>

            {/* Tap/click hint — only when not yet pinned (hover preview state on desktop) */}
            {!isPinned && (
              <p className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
                Click to pin · Tap elsewhere to dismiss
              </p>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
