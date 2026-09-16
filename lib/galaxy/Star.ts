/**
 * ==============================================================================
 * Vector3 Interface
 * ==============================================================================
 * Pure representation of a point or direction in 3-dimensional Euclidean space.
 * Kept framework-agnostic (independent of THREE.Vector3) to preserve clean
 * architectural separation between domain logic and graphical rendering.
 * ==============================================================================
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * ==============================================================================
 * Star Domain Model
 * ==============================================================================
 * Architectural Decision: Domain Entity vs. Graphical Mesh
 *
 * In CommitCosmos, a Star is a foundational conceptual domain entity representing
 * an immutable Git commit projected into the celestial space.
 *
 * Separation of Concerns:
 * - What a Star IS (Domain Model):
 *   Identity (id, commit SHA), spectral color (derived from language), 3D coordinate,
 *   luminosity/brightness state, and behavioral transitions (ignite).
 * - How a Star is DRAWN (Render Layer):
 *   Shaders, billboard sprites, Three.js instanced meshes, bloom passes, post-processing.
 *
 * This separation ensures the core celestial physics, placement math, and unit tests
 * remain pure, performant, and testable without requiring a WebGL context or DOM.
 * ==============================================================================
 */
export class Star {
  public readonly id: string;
  public readonly commitSha: string;
  public readonly color: string;
  public readonly position: Vector3;
  public brightness: number;
  public readonly sizeMultiplier: number;
  public readonly brightnessMultiplier: number;
  public readonly magnitude: number | null;
  public readonly isPrMerge: boolean;
  public readonly prNumber: number | null;
  public readonly secondaryColor: string;

  constructor(
    id: string,
    commitSha: string,
    color: string,
    position: Vector3,
    brightness: number = 0.0,
    sizeMultiplier: number = 1.0,
    brightnessMultiplier: number = 1.0,
    magnitude: number | null = null,
    isPrMerge: boolean = false,
    prNumber: number | null = null,
    secondaryColor: string = '#38bdf8'
  ) {
    this.id = id;
    this.commitSha = commitSha;
    this.color = color;
    this.position = position;
    this.brightness = brightness;
    this.sizeMultiplier = sizeMultiplier;
    this.brightnessMultiplier = brightnessMultiplier;
    this.magnitude = magnitude;
    this.isPrMerge = isPrMerge;
    this.prNumber = prNumber;
    this.secondaryColor = secondaryColor;
  }

  /**
   * Sets the star brightness to 1.0 (full luminosity).
   * Called when a star first ignites or when animated into the galaxy view.
   */
  public ignite(): void {
    this.brightness = 1.0;
  }
}
