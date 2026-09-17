'use client';

import { RotateCcw, Crosshair, Film, Camera } from 'lucide-react';
import { useGalaxyStore } from '@/lib/store';

interface CameraControlsProps {
  onResetView: () => void;
  onFocusLatestStar: () => void;
  hasLatestStar: boolean;
  onExportWallpaper?: () => void;
}

/**
 * ==============================================================================
 * CameraControls
 * ==============================================================================
 * Positioned in the bottom-right corner as an HTML overlay.
 * Provides four essential navigation & presentation actions:
 *  1. Reset View: returns camera to default position and target
 *  2. Focus Latest Star: centers camera on the newest commit star
 *  3. Cinematic Tour: automated choreographed flight through the cosmos
 *  4. Export Wallpaper: captures a high-resolution branded celestial snapshot
 * ==============================================================================
 */
export function CameraControls({
  onResetView,
  onFocusLatestStar,
  hasLatestStar,
  onExportWallpaper,
}: CameraControlsProps) {
  const { isCinematicTour, toggleCinematicTour } = useGalaxyStore();

  return (
    <nav
      aria-label="3D Galaxy camera controls"
      className="absolute bottom-20 sm:bottom-20 right-4 sm:right-6 z-30 flex items-center gap-2 pointer-events-auto select-none flex-wrap justify-end"
    >
      {/* 1. Cinematic Tour Button */}
      <button
        type="button"
        onClick={toggleCinematicTour}
        aria-pressed={isCinematicTour}
        aria-label={isCinematicTour ? 'Stop cinematic tour (ESC)' : 'Start cinematic tour'}
        className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-xl border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
          isCinematicTour
            ? 'bg-violet-950/90 border-violet-500/80 text-violet-200 shadow-xl shadow-violet-950/80 ring-1 ring-violet-500/40'
            : 'bg-black/80 hover:bg-black/95 border-white/10 hover:border-violet-500/50 text-slate-300 hover:text-white shadow-2xl shadow-black/80'
        }`}
      >
        {isCinematicTour ? (
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
        ) : (
          <Film
            className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform duration-200"
            aria-hidden="true"
          />
        )}
        <span className="text-xs font-medium tracking-wide">
          {isCinematicTour ? 'Touring (ESC)' : 'Cinematic Tour'}
        </span>
      </button>

      {/* 2. Reset View Button */}
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
        <span className="text-xs font-medium tracking-wide hidden sm:inline">Reset view</span>
      </button>

      {/* 3. Focus Latest Star Button */}
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
        <span className="text-xs font-medium tracking-wide hidden sm:inline">Focus latest</span>
      </button>

      {/* 4. Export Wallpaper Button */}
      {onExportWallpaper && (
        <button
          type="button"
          onClick={onExportWallpaper}
          title="Export 4K cosmic wallpaper"
          aria-label="Export high-resolution galaxy wallpaper"
          className="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 text-slate-300 hover:text-white shadow-2xl shadow-black/80 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <Camera
            className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform duration-200"
            aria-hidden="true"
          />
          <span className="text-xs font-medium tracking-wide hidden sm:inline">Wallpaper</span>
        </button>
      )}
    </nav>
  );
}
