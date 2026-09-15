import { Star, type Vector3 } from './Star';

/**
 * ==============================================================================
 * Cluster Domain Model
 * ==============================================================================
 * Represents an astronomical grouping of stars belonging to a specific project/repository.
 *
 * Responsibilities:
 * - Maintains membership of all Star entities belonging to the repository
 * - Calculates the geometric centroid (average 3D position) of its constituent stars,
 *   which provides the optimal camera framing target when a user inspects a project.
 * ==============================================================================
 */
export class Cluster {
  public readonly repoId: string;
  public readonly name: string;
  private readonly _stars: Star[];

  constructor(repoId: string, name: string, initialStars: Star[] = []) {
    this.repoId = repoId;
    this.name = name;
    this._stars = [...initialStars];
  }

  /**
   * Returns a shallow copy of the stars belonging to this cluster.
   */
  public get stars(): readonly Star[] {
    return this._stars;
  }

  /**
   * Adds a star to the cluster.
   */
  public addStar(star: Star): void {
    this._stars.push(star);
  }

  /**
   * Computes the geometric centroid (average position) of all stars in the cluster.
   * If the cluster has no stars, defaults to the galaxy origin (0, 0, 0).
   *
   * Formula:
   * Centroid = (1 / N) * Σ (star.position)
   */
  public get centroid(): Vector3 {
    if (this._stars.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    for (const star of this._stars) {
      sumX += star.position.x;
      sumY += star.position.y;
      sumZ += star.position.z;
    }

    const count = this._stars.length;
    return {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
    };
  }
}
