'use client';

import { useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';
import { useGalaxyStore } from '@/lib/store';
import type { GalaxyCommit } from '@/lib/queries';

interface GalaxyTimelineScrubberProps {
  commits: GalaxyCommit[];
}

/**
 * ==============================================================================
 * GalaxyTimelineScrubber Component
 * ==============================================================================
 * Floating interactive HUD at the bottom of the 3D Galaxy viewport.
 * Enables users & hackathon judges to scrub back in time and replay the
 * chronological expansion of the developer's universe.
 * ==============================================================================
 */
export function GalaxyTimelineScrubber({ commits }: GalaxyTimelineScrubberProps) {
  const {
    timelineIndex,
    setTimelineIndex,
    isTimelinePlaying,
    setIsTimelinePlaying,
    timelineSpeed,
    setTimelineSpeed,
  } = useGalaxyStore();

  const totalCommits = commits.length;

  // Chronologically sorted commits
  const sortedCommits = useMemo(() => {
    return [...commits].sort(
      (a, b) => new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime()
    );
  }, [commits]);

  const currentIndex = timelineIndex === null ? totalCommits : Math.min(timelineIndex, totalCommits);

  const currentCommit = sortedCommits[Math.max(0, currentIndex - 1)];
  const formattedDate = currentCommit
    ? new Date(currentCommit.committedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Present';

  // Playback loop
  useEffect(() => {
    if (!isTimelinePlaying || totalCommits <= 1) return;

    const intervalMs = Math.max(80, Math.floor(450 / timelineSpeed));

    const interval = setInterval(() => {
      const activeIdx = useGalaxyStore.getState().timelineIndex;
      const cur = activeIdx === null ? 1 : activeIdx;
      const next = cur + 1;
      if (next >= totalCommits) {
        setIsTimelinePlaying(false);
        setTimelineIndex(null);
      } else {
        setTimelineIndex(next);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isTimelinePlaying, timelineSpeed, totalCommits, setTimelineIndex, setIsTimelinePlaying]);

  if (totalCommits <= 2) {
    return null;
  }

  const togglePlay = () => {
    if (isTimelinePlaying) {
      setIsTimelinePlaying(false);
    } else {
      if (currentIndex >= totalCommits) {
        setTimelineIndex(1);
      }
      setIsTimelinePlaying(true);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTimelinePlaying(false);
    const val = Number(e.target.value);
    if (val >= totalCommits) {
      setTimelineIndex(null);
    } else {
      setTimelineIndex(Math.max(1, val));
    }
  };

  const handleResetToPresent = () => {
    setIsTimelinePlaying(false);
    setTimelineIndex(null);
  };

  const cycleSpeed = () => {
    if (timelineSpeed === 1) setTimelineSpeed(2);
    else if (timelineSpeed === 2) setTimelineSpeed(4);
    else setTimelineSpeed(1);
  };

  const isLive = timelineIndex === null || timelineIndex >= totalCommits;

  return (
    <div
      role="region"
      aria-label="Galaxy Evolution Time-Lapse Scrubber"
      className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2 max-w-[92vw] sm:max-w-md w-full px-2"
    >
      <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-black/85 hover:bg-black/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/90 text-slate-200 transition-all duration-200">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isTimelinePlaying ? 'Pause timeline replay' : 'Play timeline replay'}
          className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center justify-center transition-all duration-150 active:scale-95"
        >
          {isTimelinePlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Timeline Slider & Labels */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1 text-slate-400 truncate">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className="text-white font-medium">{formattedDate}</span>
            </span>
            <span className="text-slate-400 font-medium">
              <strong className="text-indigo-300">{currentIndex}</strong>
              <span className="text-slate-600"> / </span>
              <span>{totalCommits} stars</span>
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={totalCommits}
            value={currentIndex}
            onChange={handleSliderChange}
            aria-label="Timeline commit scrubber"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>

        {/* Speed Selector */}
        <button
          type="button"
          onClick={cycleSpeed}
          title="Playback speed"
          aria-label={`Playback speed: ${timelineSpeed}x`}
          className="flex-shrink-0 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1"
        >
          <FastForward className="w-3 h-3 text-slate-400" />
          <span>{timelineSpeed}x</span>
        </button>

        {/* Live Present Reset */}
        <button
          type="button"
          onClick={handleResetToPresent}
          disabled={isLive}
          title="Return to present live view"
          aria-label="Return to live present galaxy"
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3 h-3 text-indigo-400" />
          <span className="hidden sm:inline font-medium">Present</span>
        </button>
      </div>
    </div>
  );
}
