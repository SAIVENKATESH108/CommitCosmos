'use client';

import React from 'react';
import { RotateCcw, Crosshair } from 'lucide-react';

interface CameraControlsProps {
  onResetView: () => void;
  onFocusLatestStar: () => void;
  hasLatestStar: boolean;
}

/**
 * ==============================================================================
 * CameraControls
 * ==============================================================================
 * Rendered as an HTML overlay (sibling of <Canvas>, outside WebGL context).
 * Positioned in the bottom-right corner (bottom-28 sm:bottom-6 right-4 sm:right-6)
 * to prevent overlap with:
 *  - The Celestial Metrics card (top-right)
 *  - The Galaxy / Accessible List view switch (header top-right)
 *  - The StarTooltip HUD card (bottom-left)
 *
 * Provides two essential navigation actions:
 *  1. Reset View: returns camera to default position [0, 20, 85] and target [0, 0, 0]
 *  2. Focus Latest Star: smoothly interpolates camera to center on the newest commit star
 *
 * Fully operable via keyboard with explicit <button> elements, visible focus rings,
 * and standard ARIA attributes.
 * ==============================================================================
 */
export function CameraControls({
  onResetView,
  onFocusLatestStar,
  hasLatestStar,
}: CameraControlsProps) {
  return (
    <nav
      aria-label="3D Galaxy camera controls"
      className="absolute bottom-28 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-2 pointer-events-auto select-none"
    >
      {/* 1. Reset View Button */}
      <button
        type="button"
        onClick={onResetView}
        aria-label="Reset 3D camera view to default position"
        className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 text-slate-300 hover:text-white shadow-2xl shadow-black/80 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <RotateCcw
          className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-[-45deg] transition-transform duration-200"
          aria-hidden="true"
        />
        <span className="text-xs font-medium tracking-wide">Reset view</span>
      </button>

      {/* 2. Focus Latest Star Button */}
      <button
        type="button"
        onClick={onFocusLatestStar}
        disabled={!hasLatestStar}
        aria-label="Focus 3D camera on the most recently committed star"
        className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 text-slate-300 hover:text-white shadow-2xl shadow-black/80 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Crosshair
          className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform duration-200"
          aria-hidden="true"
        />
        <span className="text-xs font-medium tracking-wide">Focus latest star</span>
      </button>
    </nav>
  );
}
