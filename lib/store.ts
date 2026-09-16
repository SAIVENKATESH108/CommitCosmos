/**
 * ==============================================================================
 * Architectural Decision: UI State (Zustand) vs. Server State (TanStack Query)
 * ==============================================================================
 * In CommitCosmos, we deliberately separate state management into two distinct domains:
 *
 * 1. Zustand (this store) handles purely synchronous, transient UI state that
 *    originates and lives only in the user's browser (e.g., currently focused star,
 *    3D camera navigation mode, accessibility view mode). UI state requires
 *    immediate 60fps reactivity without network latency or caching logic.
 *
 * 2. TanStack Query (/lib/queries.ts) handles asynchronous server state (commit history,
 *    streaks, stats). Storing server data in a global client store introduces
 *    manual synchronization boilerplate, cache invalidation bugs, and stale data.
 *    TanStack Query abstracts fetching, caching, deduplication, and background polling.
 * ==============================================================================
 */

import { create } from 'zustand';

export type CameraMode = 'orbit' | 'free' | 'cinematic' | 'constellation';

export interface GalaxyUIState {
  /** ID/SHA of the commit star currently focused or clicked in the 3D scene */
  selectedStarId: string | null;
  setSelectedStarId: (id: string | null) => void;

  /** ID of the star currently under the pointer (clears on pointer-out, not on touch) */
  hoveredStarId: string | null;
  setHoveredStarId: (id: string | null) => void;

  /**
   * ID of the star that was last clicked/tapped.
   * Unlike hoveredStarId this PERSISTS after the pointer leaves — it drives the
   * tooltip HUD so touch users (who have no hover) can inspect a star after tapping.
   * Set to null to dismiss the tooltip.
   */
  pinnedStarId: string | null;
  setPinnedStarId: (id: string | null) => void;

  /** Active camera navigation mode in the 3D space */
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  /** Whether the accessible 2D list-view fallback is active instead of the WebGL 3D scene */
  isAccessibilityListView: boolean;
  isListView: boolean;
  setAccessibilityListView: (active: boolean) => void;
  setIsListView: (active: boolean) => void;
  toggleAccessibilityListView: () => void;
  toggleListView: () => void;

  /** Resets interactive UI selection back to scene defaults */
  resetUIState: () => void;
}

export const useGalaxyStore = create<GalaxyUIState>((set) => ({
  selectedStarId: null,
  setSelectedStarId: (id) => set({ selectedStarId: id }),

  hoveredStarId: null,
  setHoveredStarId: (id) =>
    set((state) => ({
      hoveredStarId: id,
      selectedStarId: state.pinnedStarId ?? id,
    })),

  pinnedStarId: null,
  setPinnedStarId: (id) =>
    set((state) => ({
      pinnedStarId: id,
      selectedStarId: id ?? state.hoveredStarId,
    })),

  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  isAccessibilityListView: false,
  get isListView() {
    return this.isAccessibilityListView;
  },
  setAccessibilityListView: (active) =>
    set({ isAccessibilityListView: active, isListView: active }),
  setIsListView: (active) =>
    set({ isAccessibilityListView: active, isListView: active }),
  toggleAccessibilityListView: () =>
    set((state) => ({
      isAccessibilityListView: !state.isAccessibilityListView,
      isListView: !state.isAccessibilityListView,
    })),
  toggleListView: () =>
    set((state) => ({
      isAccessibilityListView: !state.isAccessibilityListView,
      isListView: !state.isAccessibilityListView,
    })),

  resetUIState: () =>
    set({
      selectedStarId: null,
      hoveredStarId: null,
      pinnedStarId: null,
      cameraMode: 'orbit',
    }),
}));
