import { StarFactory } from '../lib/galaxy/StarFactory';
import {
  buildConstellationChains,
  computeConstellationEdges,
  CONSTELLATION_COMPLETION_THRESHOLD,
} from '../lib/galaxy/Constellation';
import type { GalaxyCommit } from '../lib/queries';

async function testConstellationMechanics() {
  console.log('=== TEST: Continuous Responsive Constellation Mechanics ===\n');

  // Scenario 1: Consecutive 3-day streak (In-progress)
  // Day 1: 2026-09-10
  // Day 2: 2026-09-11
  // Day 3: 2026-09-12
  const commitsStreak3: GalaxyCommit[] = [
    {
      id: 'c1',
      projectId: 'p1',
      sha: 'sha1',
      message: 'Day 1 commit',
      language: 'TypeScript',
      committedAt: '2026-09-10T10:00:00Z',
      magnitude: 30,
    },
    {
      id: 'c2',
      projectId: 'p1',
      sha: 'sha2',
      message: 'Day 2 commit',
      language: 'TypeScript',
      committedAt: '2026-09-11T12:00:00Z',
      magnitude: 40,
    },
    {
      id: 'c3',
      projectId: 'p1',
      sha: 'sha3',
      message: 'Day 3 commit',
      language: 'TypeScript',
      committedAt: '2026-09-12T15:00:00Z',
      magnitude: 50,
    },
  ];

  const stars3 = commitsStreak3.map((c, i) => StarFactory.fromCommit(c, i, 3, 45));
  const chains3 = buildConstellationChains(stars3, commitsStreak3);
  const edges3 = computeConstellationEdges(chains3);

  console.log('--- Scenario 1: 3-Day Streak ---');
  console.log('Chains count:', chains3.length);
  console.log('Chain 1 streak length:', chains3[0]?.streakLength);
  console.log('Total connector edges:', edges3.length);
  edges3.forEach((e, idx) => {
    console.log(
      `  Edge ${idx + 1} (${e.fromStar.id} -> ${e.toStar.id}): streakDay=${e.streakAtEdge}, opacity=${e.opacity}, lineWidth=${e.lineWidth}, color=${e.color}`
    );
  });

  if (edges3.length !== 2) {
    throw new Error(`Expected 2 edges for 3-day streak, got ${edges3.length}`);
  }
  if (edges3[0].opacity >= edges3[1].opacity) {
    throw new Error('Expected edge 2 to be brighter than edge 1 as streak progresses!');
  }
  console.log('✓ Verified: 3-day streak produces 2 continuous connector lines scaling in brightness!\n');

  // Scenario 2: Streak Break & Past Persistence
  // Past streak: Day 1 (2026-09-01), Day 2 (2026-09-02)
  // MISSED DAYS: 2026-09-03 to 2026-09-09
  // New streak: Day 10 (2026-09-10), Day 11 (2026-09-11)
  const commitsBrokenStreak: GalaxyCommit[] = [
    {
      id: 'past1',
      projectId: 'p1',
      sha: 'p1',
      message: 'Past Day 1',
      language: 'Rust',
      committedAt: '2026-09-01T09:00:00Z',
      magnitude: 20,
    },
    {
      id: 'past2',
      projectId: 'p1',
      sha: 'p2',
      message: 'Past Day 2',
      language: 'Rust',
      committedAt: '2026-09-02T09:00:00Z',
      magnitude: 30,
    },
    // Break happens here: missed day!
    {
      id: 'new1',
      projectId: 'p1',
      sha: 'n1',
      message: 'New Day 10',
      language: 'Python',
      committedAt: '2026-09-10T14:00:00Z',
      magnitude: 25,
    },
    {
      id: 'new2',
      projectId: 'p1',
      sha: 'n2',
      message: 'New Day 11',
      language: 'Python',
      committedAt: '2026-09-11T14:00:00Z',
      magnitude: 45,
    },
  ];

  const starsBroken = commitsBrokenStreak.map((c, i) => StarFactory.fromCommit(c, i, 4, 45));
  const chainsBroken = buildConstellationChains(starsBroken, commitsBrokenStreak);
  const edgesBroken = computeConstellationEdges(chainsBroken);

  console.log('--- Scenario 2: Streak Break & Past Persistence ---');
  console.log('Chains count:', chainsBroken.length);
  console.log('Chain 1 (Past) streak length:', chainsBroken[0]?.streakLength, 'isCurrent:', chainsBroken[0]?.isCurrentStreak);
  console.log('Chain 2 (New) streak length:', chainsBroken[1]?.streakLength, 'isCurrent:', chainsBroken[1]?.isCurrentStreak);
  console.log('Total connector edges:', edgesBroken.length);
  edgesBroken.forEach((e, idx) => {
    console.log(
      `  Edge ${idx + 1} (${e.fromStar.id} -> ${e.toStar.id}): isCurrent=${e.isCurrentStreak}, streakDay=${e.streakAtEdge}, opacity=${e.opacity}`
    );
  });

  if (chainsBroken.length !== 2) {
    throw new Error(`Expected 2 separate chains after break, got ${chainsBroken.length}`);
  }
  if (edgesBroken.length !== 2) {
    throw new Error(`Expected 2 total edges (1 past + 1 new), got ${edgesBroken.length}`);
  }
  if (edgesBroken[0].isCurrentStreak !== false || edgesBroken[1].isCurrentStreak !== true) {
    throw new Error('Expected past edge to be marked isCurrent=false and new edge isCurrent=true');
  }
  console.log('✓ Verified: Past streak segment preserved permanently! Break starts separate fresh chain.\n');

  // Scenario 3: 7-day Completed Constellation
  const commits7Days: GalaxyCommit[] = Array.from({ length: 7 }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return {
      id: `day-${i + 1}`,
      projectId: 'p1',
      sha: `sha-${i + 1}`,
      message: `Day ${i + 1} commit`,
      language: 'TypeScript',
      committedAt: `2026-09-${day}T12:00:00Z`,
      magnitude: 35 + i * 5,
    };
  });

  const stars7 = commits7Days.map((c, i) => StarFactory.fromCommit(c, i, 7, 45));
  const chains7 = buildConstellationChains(stars7, commits7Days);
  const edges7 = computeConstellationEdges(chains7);

  console.log('--- Scenario 3: 7-Day Completed Constellation ---');
  console.log('Chains count:', chains7.length);
  console.log('Chain streak length:', chains7[0]?.streakLength);
  console.log('Chain isComplete:', chains7[0]?.isComplete);
  console.log('Chain Name:', chains7[0]?.name);
  console.log('Completed edges count:', edges7.length);
  console.log('Completed edge color:', edges7[5]?.color);
  console.log('Completed edge opacity:', edges7[5]?.opacity);
  console.log('Completed edge lineWidth:', edges7[5]?.lineWidth);

  if (!chains7[0]?.isComplete) {
    throw new Error('Expected 7-day streak to be marked complete!');
  }
  if (edges7[5].opacity < 0.9 || edges7[5].lineWidth < 3.0) {
    throw new Error('Expected completed constellation edge to receive brilliant starlight styling!');
  }
  console.log('✓ Verified: 7-day streak triggers constellation complete treatment!\n');

  console.log('ALL CONSTELLATION TESTS PASSED PERFECTLY!');
}

testConstellationMechanics().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
