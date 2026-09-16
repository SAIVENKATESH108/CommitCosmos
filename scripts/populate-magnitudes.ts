import { db } from '../db';
import { commits } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Populating magnitudes for existing commits in Neon DB...');

  const allCommits = await db.select().from(commits);
  console.log(`Found ${allCommits.length} commits in database.`);

  const magnitudeMap: Record<string, number> = {
    // SHA prefix -> magnitude
    '5aa41f7': 120, // Major overhaul of Cosmic Observatory, telemetry, wizard
    '6c0dbdc': 65,  // Server webpack cache, Satori OG styles, public brand
    '601ca5e': 85,  // Zustand UI + TanStack Query server state split
    '29b9bfa': 75,  // GitHub push webhook, rate limiting, HMAC-SHA256
    '7ddc9fa': 90,  // NextAuth v5, GitHub OAuth, session cookies
    'fcde622': 80,  // Strongly-typed repository layer for entities
    '10b287f': 100, // Drizzle schema, streak triggers, database view
  };

  for (const c of allCommits) {
    const prefix = c.sha.slice(0, 7);
    const assignedMag = magnitudeMap[prefix] ?? Math.max(25, Math.min(80, (c.message || '').length));
    await db
      .update(commits)
      .set({ magnitude: assignedMag })
      .where(eq(commits.id, c.id));
    console.log(`Updated commit ${prefix} -> magnitude: ${assignedMag}`);
  }

  console.log('✓ All existing commits populated with magnitude values.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
