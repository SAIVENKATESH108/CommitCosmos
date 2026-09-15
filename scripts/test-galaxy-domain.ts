import { starPosition } from '../lib/galaxy/starPlacement';
import { Star } from '../lib/galaxy/Star';
import { Cluster } from '../lib/galaxy/Cluster';
import {
  Constellation,
  CONSTELLATION_COMPLETION_THRESHOLD,
} from '../lib/galaxy/Constellation';
import { StarFactory } from '../lib/galaxy/StarFactory';

function euclideanDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

async function runGalaxyDomainTests() {
  console.log('=== Galaxy Domain Model & Distribution Tests ===\n');

  // ============================================================================
  // Test 1: Star Domain Model & ignite()
  // ============================================================================
  console.log('1. Testing Star domain model...');
  const testStar: Star = new Star('star-1', 'abc1234', '#38bdf8', { x: 10, y: 20, z: 30 }, 0.0);
  console.log(`   Initial brightness: ${testStar.brightness} (Expected: 0.0)`);
  if (testStar.brightness !== 0.0) {
    throw new Error(`Expected brightness 0.0, got ${testStar.brightness}`);
  }

  testStar.ignite();
  const currentBrightness: number = testStar.brightness;
  console.log(`   Ignited brightness: ${currentBrightness} (Expected: 1.0)`);
  if (currentBrightness !== 1.0) {
    throw new Error(`Expected brightness 1.0, got ${currentBrightness}`);
  }
  console.log('   ✓ Star entity and ignite() passed.');

  // ============================================================================
  // Test 2: Cluster Domain Model & Centroid Calculation
  // ============================================================================
  console.log('\n2. Testing Cluster domain model & centroid...');
  const cluster = new Cluster('repo-101', 'commit-cosmos');

  console.log(`   Empty cluster centroid:`, cluster.centroid);
  if (cluster.centroid.x !== 0 || cluster.centroid.y !== 0 || cluster.centroid.z !== 0) {
    throw new Error('Expected empty cluster centroid to be at origin (0,0,0)');
  }

  const s1 = new Star('s1', 'sha1', '#fff', { x: 10, y: 0, z: 0 });
  const s2 = new Star('s2', 'sha2', '#fff', { x: -10, y: 0, z: 0 });
  const s3 = new Star('s3', 'sha3', '#fff', { x: 0, y: 30, z: 60 });

  cluster.addStar(s1);
  cluster.addStar(s2);
  cluster.addStar(s3);

  console.log(`   Cluster has ${cluster.stars.length} stars`);
  const centroid = cluster.centroid;
  console.log('   Calculated centroid:', centroid, '(Expected: x=0, y=10, z=20)');

  if (
    Math.abs(centroid.x - 0) > 1e-6 ||
    Math.abs(centroid.y - 10) > 1e-6 ||
    Math.abs(centroid.z - 20) > 1e-6
  ) {
    throw new Error(`Centroid mismatch: expected (0, 10, 20), got (${centroid.x}, ${centroid.y}, ${centroid.z})`);
  }
  console.log('   ✓ Cluster addStar() and centroid calculation passed.');

  // ============================================================================
  // Test 3: Constellation Domain Model & Milestone Completion
  // ============================================================================
  console.log('\n3. Testing Constellation completion threshold...');
  console.log(`   CONSTELLATION_COMPLETION_THRESHOLD is ${CONSTELLATION_COMPLETION_THRESHOLD} days.`);

  const constellationIncomplete = new Constellation([s1, s2], 5);
  console.log(`   Streak 5 isComplete: ${constellationIncomplete.isComplete} (Expected: false)`);
  if (constellationIncomplete.isComplete !== false) {
    throw new Error('Constellation should not be complete with streak 5');
  }

  const constellationComplete7 = new Constellation([s1, s2], 7);
  console.log(`   Streak 7 isComplete: ${constellationComplete7.isComplete} (Expected: true)`);
  if (constellationComplete7.isComplete !== true) {
    throw new Error('Constellation should be complete with streak 7');
  }

  const constellationComplete14 = new Constellation([s1, s2], 14);
  console.log(`   Streak 14 isComplete: ${constellationComplete14.isComplete} (Expected: true)`);
  if (constellationComplete14.isComplete !== true) {
    throw new Error('Constellation should be complete with streak 14');
  }
  console.log('   ✓ Constellation isComplete logic passed.');

  // ============================================================================
  // Test 4: Golden-Angle Spiral Distribution (Fibonacci Sphere) Verification
  // ============================================================================
  console.log('\n4. Testing Golden-Angle Spiral placement algorithm (Fibonacci Sphere)...');
  const totalPoints = 100;
  const radius = 50;
  const points: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < totalPoints; i++) {
    const pos = starPosition(i, totalPoints, radius);

    // Verify all points lie on the sphere surface: x² + y² + z² = R²
    const distFromOrigin = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    if (Math.abs(distFromOrigin - radius) > 1e-4) {
      throw new Error(`Point ${i} is not on the sphere surface! Distance = ${distFromOrigin}, expected ${radius}`);
    }

    points.push(pos);
  }
  console.log(`   ✓ Verified all ${totalPoints} points sit precisely on the sphere surface of radius ${radius}.`);

  // Compute pairwise minimum distances
  let minDistance = Infinity;
  let maxDistance = 0;
  let sumDistance = 0;
  let pairCount = 0;

  // Nearest-neighbor distance array
  const nearestNeighborDistances: number[] = [];

  for (let i = 0; i < points.length; i++) {
    let nearestDist = Infinity;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const d = euclideanDistance(points[i], points[j]);
      if (d < nearestDist) {
        nearestDist = d;
      }
      if (i < j) {
        if (d < minDistance) minDistance = d;
        if (d > maxDistance) maxDistance = d;
        sumDistance += d;
        pairCount++;
      }
    }
    nearestNeighborDistances.push(nearestDist);
  }

  const minNearestNeighbor = Math.min(...nearestNeighborDistances);
  const maxNearestNeighbor = Math.max(...nearestNeighborDistances);
  const avgNearestNeighbor =
    nearestNeighborDistances.reduce((a, b) => a + b, 0) / nearestNeighborDistances.length;

  console.log(`   Distance Metrics for N = ${totalPoints}, Radius = ${radius}:`);
  console.log(`   - Global pairwise min distance: ${minDistance.toFixed(3)} units`);
  console.log(`   - Global pairwise max distance: ${maxDistance.toFixed(3)} units (antipodal ~${radius * 2})`);
  console.log(`   - Global pairwise avg distance: ${(pairCount > 0 ? sumDistance / pairCount : 0).toFixed(3)} units`);
  console.log(`   - Nearest neighbor minimum distance: ${minNearestNeighbor.toFixed(3)} units`);
  console.log(`   - Nearest neighbor maximum distance: ${maxNearestNeighbor.toFixed(3)} units`);
  console.log(`   - Nearest neighbor average distance: ${avgNearestNeighbor.toFixed(3)} units`);

  // On a sphere with R=50, Area = 4πR² ≈ 31,415 sq units.
  // Each point occupies ~314 sq units, giving an expected spacing of ~sqrt(314) ≈ 17.7 units.
  // Theoretical minimum distance for random packing is near 0; for golden angle spiral it is consistently >= 8 units.
  const expectedMinThreshold = 7.0; // Reasonable guaranteed minimum separation
  console.log(`   - Checking min separation >= threshold of ${expectedMinThreshold} units...`);
  if (minNearestNeighbor < expectedMinThreshold) {
    throw new Error(
      `Points clustered too closely! Nearest neighbor distance ${minNearestNeighbor} < ${expectedMinThreshold}`
    );
  }
  console.log(
    `   ✓ Even distribution confirmed: no two points closer than ${minNearestNeighbor.toFixed(2)} units (threshold: ${expectedMinThreshold})!`
  );

  // ============================================================================
  // Test 5: StarFactory (Factory Pattern) Verification
  // ============================================================================
  console.log('\n5. Testing StarFactory...');
  const rawTsCommit = {
    id: 'c-ts-1',
    sha: 'abcdef0123456789',
    language: 'TypeScript',
    message: 'refactor: factory pattern',
  };

  const rawPyCommit = {
    id: 'c-py-1',
    sha: '1234567890abcdef',
    language: 'Python',
    message: 'feat: analytics',
  };

  const starTs = StarFactory.fromCommit(rawTsCommit, 0, 10, radius);
  const starPy = StarFactory.fromCommit(rawPyCommit, 1, 10, radius);

  console.log(`   Star TS: color=${starTs.color}, pos=(${starTs.position.x.toFixed(1)}, ${starTs.position.y.toFixed(1)}, ${starTs.position.z.toFixed(1)}), brightness=${starTs.brightness}`);
  console.log(`   Star Py: color=${starPy.color}, pos=(${starPy.position.x.toFixed(1)}, ${starPy.position.y.toFixed(1)}, ${starPy.position.z.toFixed(1)}), brightness=${starPy.brightness}`);

  if (starTs.color !== '#38bdf8') {
    throw new Error(`Expected TypeScript star color #38bdf8, got ${starTs.color}`);
  }
  if (starPy.color !== '#60a5fa') {
    throw new Error(`Expected Python star color #60a5fa, got ${starPy.color}`);
  }
  if (starTs.brightness !== 0.0) {
    throw new Error(`Expected newly created star brightness 0.0, got ${starTs.brightness}`);
  }
  console.log('   ✓ StarFactory created properly styled and positioned Star entities.');

  console.log('\n=== All Galaxy Domain Model & Placement Tests Passed! ===');
}

runGalaxyDomainTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
