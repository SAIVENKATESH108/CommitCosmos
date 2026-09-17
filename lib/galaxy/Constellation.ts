import { Star } from './Star';
import type { GalaxyCommit } from '../queries';

/**
 * The consecutive daily commit streak length required to unlock and complete a constellation.
 * In CommitCosmos, a full 7-day week of consecutive commits completes a stellar constellation.
 */
export const CONSTELLATION_COMPLETION_THRESHOLD = 7;

export interface ConstellationEdge {
  /** Unique deterministic identifier, e.g. "edge-starA-starB" */
  id: string;
  fromStar: Star;
  toStar: Star;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  /** The streak day achieved at this specific edge (2, 3, 4, 5, 6, 7+) */
  streakAtEdge: number;
  /** Total streak length of the entire chain */
  streakLength: number;
  /** True when streak reaches or exceeds 7 days */
  isComplete: boolean;
  /** Whether this edge belongs to the user's active, in-progress streak */
  isCurrentStreak: boolean;
  /** Visual styling attributes */
  color: string;
  opacity: number;
  lineWidth: number;
  constellationName?: string;
}

export interface ConstellationSegment {
  id: string;
  stars: Star[];
  dates: string[];
  streakLength: number;
  isComplete: boolean;
  isCurrentStreak: boolean;
  name?: string;
}

/**
 * ==============================================================================
 * Constellation Domain Model
 * ==============================================================================
 * Represents a connected set of stars forged across continuous daily commit activity.
 *
 * Responsibilities:
 * - Links sequential stars together into a celestial pattern
 * - Continuously responsive: ANY 2+ consecutive-day stars form connecting lines
 * - Opacity & line width scale smoothly with current streak progress
 * - Preserves past streaks: missed days break the chain for NEW commits, but
 *   historical constellations stay permanently visible.
 * ==============================================================================
 */
export class Constellation {
  public readonly stars: readonly Star[];
  public readonly streakLength: number;
  public readonly name?: string;
  public readonly isCurrentStreak: boolean;

  constructor(
    stars: Star[],
    streakLength: number,
    name?: string,
    isCurrentStreak = false
  ) {
    this.stars = [...stars];
    this.streakLength = streakLength;
    this.name = name;
    this.isCurrentStreak = isCurrentStreak;
  }

  /**
   * Returns true when the streak length meets or exceeds the completion milestone threshold (7 days).
   */
  public get isComplete(): boolean {
    return this.streakLength >= CONSTELLATION_COMPLETION_THRESHOLD;
  }
}

/**
 * Computes visual styling tokens for a connector line edge based on streak progress.
 *
 * Visual progression:
 * - Day 2: faint, thin cyan line (0.35 opacity, 1.2px) -> signals progress has started
 * - Day 3: brighter, thicker cyan-blue (0.45 opacity, 1.5px)
 * - Day 4: luminous blue (0.55 opacity, 1.8px)
 * - Day 5: luminous indigo (0.65 opacity, 2.1px)
 * - Day 6: vibrant celestial purple-indigo (0.75 opacity, 2.5px)
 * - Day 7+: completed constellation treatment (0.95 opacity, 3.2px, brilliant starlight #e0e7ff)
 */
export function getConnectorLineStyle(streakAtEdge: number, isComplete: boolean) {
  if (isComplete || streakAtEdge >= CONSTELLATION_COMPLETION_THRESHOLD) {
    return {
      color: '#e0e7ff', // Brilliant celestial incandescent starlight
      opacity: 0.95,
      lineWidth: 3.2,
    };
  }

  switch (streakAtEdge) {
    case 2:
      return {
        color: '#38bdf8', // Muted cyan
        opacity: 0.38,
        lineWidth: 1.3,
      };
    case 3:
      return {
        color: '#38bdf8',
        opacity: 0.48,
        lineWidth: 1.6,
      };
    case 4:
      return {
        color: '#60a5fa', // Stellar blue
        opacity: 0.58,
        lineWidth: 1.9,
      };
    case 5:
      return {
        color: '#818cf8', // Indigo
        opacity: 0.68,
        lineWidth: 2.2,
      };
    case 6:
      return {
        color: '#a5b4fc', // Vibrant lavender-indigo
        opacity: 0.78,
        lineWidth: 2.6,
      };
    default:
      return {
        color: '#38bdf8',
        opacity: 0.4,
        lineWidth: 1.4,
      };
  }
}

/**
 * Builds continuous constellation segments from commits and stars:
 * 1. Groups stars by calendar day (UTC).
 * 2. Connects consecutive days (diffDays === 1).
 * 3. When a day is missed (diffDays > 1), terminates the previous chain so past
 *    work is preserved, and starts a fresh chain for subsequent commits.
 */
export function buildConstellationChains(
  stars: Star[],
  commits: GalaxyCommit[]
): ConstellationSegment[] {
  if (!stars || stars.length < 2 || !commits || commits.length < 2) {
    return [];
  }

  // Map each star by its commit ID
  const starMap = new Map<string, Star>();
  stars.forEach((s) => starMap.set(s.id, s));

  // 1. Group commits by calendar day
  const commitsByDay = new Map<string, GalaxyCommit[]>();
  commits.forEach((c) => {
    const dayStr = c.committedAt.slice(0, 10); // "YYYY-MM-DD"
    const list = commitsByDay.get(dayStr) || [];
    list.push(c);
    commitsByDay.set(dayStr, list);
  });

  // 2. Determine representative star for each day (highest magnitude or latest commit)
  const uniqueDays = Array.from(commitsByDay.keys()).sort(); // Chronological order
  const dayNodes: { dateStr: string; date: Date; star: Star }[] = [];

  uniqueDays.forEach((dayStr) => {
    const dayCommits = commitsByDay.get(dayStr) || [];
    // Sort day's commits to pick the most prominent anchor star
    dayCommits.sort((a, b) => {
      const magA = a.magnitude ?? 0;
      const magB = b.magnitude ?? 0;
      if (magB !== magA) return magB - magA;
      return new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime();
    });

    const primaryCommit = dayCommits[0];
    const star = starMap.get(primaryCommit.id);
    if (star) {
      dayNodes.push({
        dateStr: dayStr,
        date: new Date(`${dayStr}T00:00:00Z`),
        star,
      });
    }
  });

  if (dayNodes.length < 2) {
    return [];
  }

  // 3. Partition consecutive days into streak chains (preserving broken streaks)
  const segments: ConstellationSegment[] = [];
  let currentStars: Star[] = [dayNodes[0].star];
  let currentDates: string[] = [dayNodes[0].dateStr];

  for (let i = 1; i < dayNodes.length; i++) {
    const prevDate = dayNodes[i - 1].date;
    const thisDate = dayNodes[i].date;
    const diffDays = Math.round(
      (thisDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      // Consecutive calendar day -> append to current streak chain
      currentStars.push(dayNodes[i].star);
      currentDates.push(dayNodes[i].dateStr);
    } else {
      // Streak broken! Finalize existing chain so past work remains permanently visible
      if (currentStars.length >= 2) {
        segments.push({
          id: `segment-${currentDates[0]}-${currentDates[currentDates.length - 1]}`,
          stars: [...currentStars],
          dates: [...currentDates],
          streakLength: currentStars.length,
          isComplete: currentStars.length >= CONSTELLATION_COMPLETION_THRESHOLD,
          isCurrentStreak: false,
          name:
            currentStars.length >= CONSTELLATION_COMPLETION_THRESHOLD
              ? "Orion's Belt"
              : currentStars.length >= 3
              ? 'Nebula Runner'
              : undefined,
        });
      }
      // Start a fresh, separate chain for commits following the break
      currentStars = [dayNodes[i].star];
      currentDates = [dayNodes[i].dateStr];
    }
  }

  // Finalize the last (active/current) chain
  if (currentStars.length >= 2) {
    segments.push({
      id: `segment-${currentDates[0]}-${currentDates[currentDates.length - 1]}`,
      stars: [...currentStars],
      dates: [...currentDates],
      streakLength: currentStars.length,
      isComplete: currentStars.length >= CONSTELLATION_COMPLETION_THRESHOLD,
      isCurrentStreak: true,
      name:
        currentStars.length >= CONSTELLATION_COMPLETION_THRESHOLD
          ? "Orion's Belt"
          : currentStars.length >= 3
          ? 'Nebula Runner'
          : undefined,
    });
  }

  // 4. Build Intra-Project Constellation Networks
  // Connects stars within each repository cluster into a celestial constellation web
  const commitsByProject = new Map<string, GalaxyCommit[]>();
  commits.forEach((c) => {
    const list = commitsByProject.get(c.projectId) || [];
    list.push(c);
    commitsByProject.set(c.projectId, list);
  });

  commitsByProject.forEach((projCommits, projId) => {
    if (projCommits.length < 2) return;

    // Sort chronologically
    projCommits.sort(
      (a, b) => new Date(a.committedAt).getTime() - new Date(b.committedAt).getTime()
    );

    const projectStars: Star[] = [];
    const projectDates: string[] = [];

    projCommits.forEach((c) => {
      const s = starMap.get(c.id);
      if (s && !projectStars.includes(s)) {
        projectStars.push(s);
        projectDates.push(c.committedAt.slice(0, 10));
      }
    });

    if (projectStars.length >= 2) {
      segments.push({
        id: `cluster-${projId}`,
        stars: projectStars,
        dates: projectDates,
        streakLength: Math.min(CONSTELLATION_COMPLETION_THRESHOLD, projectStars.length),
        isComplete: projectStars.length >= 5,
        isCurrentStreak: false,
        name: 'Cluster Constellation',
      });
    }
  });

  return segments;
}

/**
 * Transforms constellation segments into individual renderable edges with styling.
 */
export function computeConstellationEdges(
  segments: ConstellationSegment[]
): ConstellationEdge[] {
  const edges: ConstellationEdge[] = [];
  const edgeDeduplication = new Set<string>();

  segments.forEach((segment) => {
    const isCluster = segment.id.startsWith('cluster-');

    for (let j = 0; j < segment.stars.length - 1; j++) {
      const fromStar = segment.stars[j];
      const toStar = segment.stars[j + 1];
      const edgeKey = [fromStar.id, toStar.id].sort().join('-');
      if (edgeDeduplication.has(edgeKey)) continue;
      edgeDeduplication.add(edgeKey);

      const streakAtEdge = j + 2; // Streak day represented by this edge (2, 3, 4...)
      const style = isCluster
        ? { color: '#818cf8', opacity: 0.68, lineWidth: 2.2 }
        : getConnectorLineStyle(streakAtEdge, segment.isComplete);

      edges.push({
        id: `edge-${fromStar.id}-${toStar.id}`,
        fromStar,
        toStar,
        startPoint: [fromStar.position.x, fromStar.position.y, fromStar.position.z],
        endPoint: [toStar.position.x, toStar.position.y, toStar.position.z],
        streakAtEdge,
        streakLength: segment.streakLength,
        isComplete: segment.isComplete,
        isCurrentStreak: segment.isCurrentStreak,
        color: style.color,
        opacity: style.opacity,
        lineWidth: style.lineWidth,
        constellationName: segment.name,
      });
    }
  });

  return edges;
}
