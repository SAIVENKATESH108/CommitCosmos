import { Star } from './Star';

/**
 * The consecutive daily commit streak length required to unlock and complete a constellation.
 * In CommitCosmos, a full 7-day week of consecutive commits completes a stellar constellation.
 */
export const CONSTELLATION_COMPLETION_THRESHOLD = 7;

/**
 * ==============================================================================
 * Constellation Domain Model
 * ==============================================================================
 * Represents a connected set of stars forged across continuous daily commit activity.
 *
 * Responsibilities:
 * - Links sequential stars together into a celestial pattern
 * - Tracks streak milestone progression
 * - Determines completion state based on the CONSTELLATION_COMPLETION_THRESHOLD (7 days)
 * ==============================================================================
 */
export class Constellation {
  public readonly stars: readonly Star[];
  public readonly streakLength: number;

  constructor(stars: Star[], streakLength: number) {
    this.stars = [...stars];
    this.streakLength = streakLength;
  }

  /**
   * Returns true when the streak length meets or exceeds the completion milestone threshold (7 days).
   */
  public get isComplete(): boolean {
    return this.streakLength >= CONSTELLATION_COMPLETION_THRESHOLD;
  }
}
