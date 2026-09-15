import { type Vector3 } from './Star';

/**
 * The Golden Ratio (φ ≈ 1.6180339887...)
 */
export const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * The Golden Angle in radians:
 * θ_gold = 2π * (1 - 1/φ) = π * (3 - √5) ≈ 2.39996322972865332 radians (~137.507764 degrees)
 *
 * Mathematical properties:
 * By turning by the golden angle at each step, successive points are positioned along
 * an irrational fraction of a full circle. This guarantees that points never line up
 * or resonate along any rational divisor (e.g. halves, thirds, quarters), preventing
 * unsightly radial banding or visible clustering.
 */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * ==============================================================================
 * Fibonacci Sphere / Golden-Angle Spiral Algorithm
 * ==============================================================================
 * Distributes N points uniformly across the surface of a sphere of radius R without
 * clustering at the poles or along longitude meridians.
 *
 * Mathematical Derivation:
 * 1. Polar / Latitude Distribution (y-coordinate):
 *    The surface area of a spherical zone between two parallel planes is proportional
 *    to the vertical distance between those planes: dA = 2π * R * dy.
 *    Therefore, partitioning the vertical interval [-1, 1] into N equal slices
 *    ensures that every point represents an equal infinitesimal area on the sphere!
 *    We calculate:
 *      y = 1 - (index / (total - 1)) * 2   (or y = 1 - (2 * index + 1) / total)
 *    For total = 1, y is placed at the equator (y = 0).
 *
 * 2. Radial Distance on the Horizontal Plane:
 *    By Pythagorean theorem on a unit sphere (x² + y² + z² = 1):
 *      radius_at_y = sqrt(1 - y²)
 *
 * 3. Azimuthal Angle (Longitude):
 *    We increment the longitude by the Golden Angle at each index:
 *      theta = index * GOLDEN_ANGLE
 *
 * 4. Cartesian Coordinates (x, z):
 *      x = radius_at_y * cos(theta) * radius
 *      z = radius_at_y * sin(theta) * radius
 *      y = y * radius
 *
 * Result:
 * An isotropic, mathematically optimal quasi-uniform distribution of stars across
 * the 3D celestial sphere, eliminating clumps, voids, and polar singularity bunching.
 *
 * @param index - Zero-based index of the star (0 to total - 1)
 * @param total - Total count of stars to distribute on the sphere (total >= 1)
 * @param radius - Radius of the celestial sphere (default 50 units)
 * @returns 3D vector coordinates { x, y, z }
 * ==============================================================================
 */
export function starPosition(
  index: number,
  total: number,
  radius: number = 50
): Vector3 {
  if (total <= 1) {
    return { x: 0, y: 0, z: radius };
  }

  // Linear spacing along the vertical axis from 1 down to -1
  // Using (1 - 2 * (index + 0.5) / total) provides symmetric half-step boundary margins
  const yNorm = 1 - (2 * index + 1) / total;

  // Radius of the circle at latitude y on a unit sphere: sqrt(1 - y²)
  const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));

  // Azimuthal angle incremented by the Golden Angle
  const theta = index * GOLDEN_ANGLE;

  const x = Math.cos(theta) * radiusAtY * radius;
  const y = yNorm * radius;
  const z = Math.sin(theta) * radiusAtY * radius;

  return { x, y, z };
}
