import { Star } from './Star';
import { starPosition } from './starPlacement';
import { getStarColorForLanguage } from '../starColors';
import type { GalaxyCommit } from '../queries';

export interface RawCommitInput {
  id: string;
  sha: string;
  language?: string | null;
  message?: string | null;
  committedAt?: string | Date;
  magnitude?: number | null;
}

/**
 * ==============================================================================
 * StarFactory (Factory Pattern)
 * ==============================================================================
 * Encapsulates the creation and instantiation logic of Star domain entities.
 *
 * Architectural Rationale:
 * Direct construction of Star objects in UI components or data fetching hooks
 * leaks domain knowledge (celestial spherical coordinates, language spectral mapping,
 * default luminosity) into the presentation tier.
 *
 * By channeling all creation through `StarFactory.fromCommit()`, the application
 * enforces:
 * 1. Consistent deterministic color resolution via `getStarColorForLanguage`
 * 2. Uniform spherical placement via `starPosition` (golden-angle spiral)
 * 3. Consistent default state initialization (e.g. initial brightness)
 * 4. Visual hierarchy calculation: sizing [0.8x, 2.0x] based on commit magnitude
 *
 * No component should instantiate a Star directly using `new Star(...)`.
 * ==============================================================================
 */
export class StarFactory {
  /**
   * Constructs a fully initialized Star domain entity from a commit data object.
   *
   * @param commit - Raw commit object containing at least id, sha, and optional language
   * @param index - The commit index within the galaxy dataset (0 to total - 1)
   * @param total - Total count of commits being placed in the galaxy
   * @param sphereRadius - Celestial radius for the spherical distribution (defaults to 50)
   * @returns Fully configured Star instance
   */
  public static fromCommit(
    commit: RawCommitInput | GalaxyCommit,
    index: number,
    total: number,
    sphereRadius: number = 50
  ): Star {
    const color = getStarColorForLanguage(commit.language);
    const position = starPosition(index, total, sphereRadius);

    // ==============================================================================
    // Visual Hierarchy: Compute Size & Brightness Multipliers from Magnitude
    // ==============================================================================
    // If commit.magnitude is recorded (lines added/removed, touched file blast radius),
    // we normalize it. Otherwise we infer a proxy from merge commit status or message length.
    let effectiveMagnitude: number;
    if (commit.magnitude != null && commit.magnitude > 0) {
      effectiveMagnitude = commit.magnitude;
    } else if (commit.message?.toLowerCase().startsWith('merge')) {
      // Merge commits represent integrated milestones (PR completions)
      effectiveMagnitude = 100;
    } else if (commit.message) {
      // Proxy based on commit message length (longer messages often detail major architectural changes)
      effectiveMagnitude = Math.max(15, Math.min(80, Math.floor(commit.message.length * 0.75)));
    } else {
      effectiveMagnitude = 25; // default baseline
    }

    // Strictly clamp normalized magnitude between [10, 120]
    // Map to size multiplier: [0.8x, 2.0x] base star size
    // Map to brightness multiplier: [0.85x, 2.2x] luminosity
    const clampedMag = Math.max(10, Math.min(120, effectiveMagnitude));
    const ratio = (clampedMag - 10) / (120 - 10); // 0.0 to 1.0
    const sizeMultiplier = 0.8 + ratio * 1.2;
    const brightnessMultiplier = 0.85 + ratio * 1.35;

    // Check PR merge status
    const isPr =
      ('isPrMerge' in commit && Boolean(commit.isPrMerge)) ||
      Boolean(commit.message?.toLowerCase().startsWith('merge'));

    const prNum =
      'prNumber' in commit && commit.prNumber != null
        ? commit.prNumber
        : commit.message?.match(/#(\d+)/)?.[1]
        ? parseInt(commit.message.match(/#(\d+)/)![1], 10)
        : null;

    // Determine complementary secondary color for swirling accretion disk
    // Contrast with primary language color: violet/purple for cyans, electric cyan for warm/other hues
    const secondaryColor =
      color.toLowerCase().includes('38bdf8') || color.toLowerCase().includes('60a5fa') || color.toLowerCase().includes('3b82f6')
        ? '#c084fc'
        : '#38bdf8';

    // Newly formed stars initialize with default brightness 0.0, ready to be ignited
    return new Star(
      commit.id,
      commit.sha,
      color,
      position,
      0.0,
      sizeMultiplier,
      brightnessMultiplier,
      effectiveMagnitude,
      isPr,
      prNum,
      secondaryColor
    );
  }
}
