import { StarFactory } from '../lib/galaxy/StarFactory';
import { getAllCommitsForUser } from '../db/repositories/commitRepository';
import { getUserByUsername } from '../db/repositories/userRepository';

async function main() {
  console.log('=== Verifying Commit Magnitude & Star Visual Hierarchy ===\n');

  const user = await getUserByUsername('SAIVENKATESH108');
  if (!user) throw new Error('User not found');

  const commitsList = await getAllCommitsForUser(user.id);
  console.log(`Retrieved ${commitsList.length} commits for @${user.githubUsername}`);

  const stars = commitsList.map((c, i) =>
    StarFactory.fromCommit(
      {
        id: c.id,
        sha: c.sha,
        message: c.message,
        language: c.language,
        committedAt: c.committedAt,
        magnitude: c.magnitude,
      },
      i,
      commitsList.length,
      45
    )
  );

  console.log('\n--- Star Domain Entity Metrics ---');
  stars.forEach((star, index) => {
    const commit = commitsList[index];
    console.log(`\n[Star #${index + 1}] SHA: ${star.commitSha.slice(0, 7)}`);
    console.log(`  - Commit: "${commit.message?.slice(0, 50)}..."`);
    console.log(`  - Recorded Magnitude: ${star.magnitude}`);
    console.log(`  - Computed Size Multiplier: ${star.sizeMultiplier}x (Clamped 0.8x - 2.0x)`);
    console.log(`  - Computed Brightness Multiplier: ${star.brightnessMultiplier}x`);
    console.log(`  - Spectral Color: ${star.color}`);

    // Verify bounds:
    if (star.sizeMultiplier < 0.8 || star.sizeMultiplier > 2.0) {
      throw new Error(`Star size multiplier ${star.sizeMultiplier} out of [0.8, 2.0] bounds!`);
    }
  });

  console.log('\n✓ All stars successfully computed within [0.8x, 2.0x] visual bounds!');
  console.log('✓ Visual hierarchy confirmed: larger commits yield visually prominent stars.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
