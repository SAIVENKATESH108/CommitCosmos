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

  /** Active camera navigation mode in the 3D space */
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  /** Whether the accessible 2D list-view fallback is active instead of the WebGL 3D scene */
  isAccessibilityListView: boolean;
  setAccessibilityListView: (active: boolean) => void;
  toggleAccessibilityListView: () => void;

  /** Resets interactive UI selection back to scene defaults */
  resetUIState: () => void;
}

export const useGalaxyStore = create<GalaxyUIState>((set) => ({
  selectedStarId: null,
  setSelectedStarId: (id) => set({ selectedStarId: id }),

  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  isAccessibilityListView: false,
  setAccessibilityListView: (active) => set({ isAccessibilityListView: active }),
  toggleAccessibilityListView: () =>
    set((state) => ({ isAccessibilityListView: !state.isAccessibilityListView })),

  resetUIState: () =>
    set({
      selectedStarId: null,
      cameraMode: 'orbit',
    }),
}));
