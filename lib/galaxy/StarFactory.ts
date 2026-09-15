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

    // Newly formed stars initialize with default brightness 0.0, ready to be ignited
    return new Star(commit.id, commit.sha, color, position, 0.0);
  }
}
