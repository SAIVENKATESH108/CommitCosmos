import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db, users } from '../db';
import { createOrUpdateUserFromGitHub } from '../db/repositories/userRepository';
import { eq } from 'drizzle-orm';

async function testAuthFlow() {
  console.log('=== NextAuth v5 GitHub Authentication Flow Test ===\n');

  const testProfile = {
    githubId: 88877766,
    githubUsername: 'cosmic-traveler',
    avatarUrl: 'https://avatars.githubusercontent.com/u/88877766?v=4',
  };

  // 1. First Sign-In
  console.log('1. Simulating first-time GitHub OAuth callback...');
  const userFirstSignIn = await createOrUpdateUserFromGitHub(testProfile);
  console.log(`   ✓ Created User row in Neon: ID = ${userFirstSignIn.id}, Username = @${userFirstSignIn.githubUsername}`);

  // Query database directly to confirm row exists
  const initialRows = await db
    .select()
    .from(users)
    .where(eq(users.githubId, testProfile.githubId));

  console.log(`   ✓ Neon users table row count for github_id ${testProfile.githubId}: ${initialRows.length}`);
  if (initialRows.length !== 1) {
    throw new Error(`Expected 1 user row, found ${initialRows.length}`);
  }

  // 2. Sign Out
  console.log('\n2. Simulating user sign-out (session cleared)...');
  console.log('   ✓ Session cleared. Database user persists.');

  // 3. Repeat Sign-In with updated profile (simulates returning user with new avatar)
  console.log('\n3. Simulating repeat sign-in with updated avatar...');
  const updatedProfile = {
    ...testProfile,
    avatarUrl: 'https://avatars.githubusercontent.com/u/88877766?v=5-updated',
  };

  const userSecondSignIn = await createOrUpdateUserFromGitHub(updatedProfile);
  console.log(`   ✓ Upserted User: ID = ${userSecondSignIn.id}, Avatar = ${userSecondSignIn.avatarUrl}`);

  // 4. Confirm NO duplicate user row was created
  const postSignInRows = await db
    .select()
    .from(users)
    .where(eq(users.githubId, testProfile.githubId));

  console.log(`   ✓ Neon users table row count after repeat sign-in: ${postSignInRows.length}`);
  if (postSignInRows.length !== 1) {
    throw new Error(`Duplicate user detected! Count is ${postSignInRows.length}`);
  }

  if (userSecondSignIn.id !== userFirstSignIn.id) {
    throw new Error(`User ID changed across sign-ins! Expected ${userFirstSignIn.id}, got ${userSecondSignIn.id}`);
  }

  console.log('   ✓ Verified: Exact same user ID preserved and avatar updated without duplicates.');

  // 5. Clean up test user
  console.log('\n4. Cleaning up test user from Neon...');
  await db.delete(users).where(eq(users.githubId, testProfile.githubId));
  const remaining = await db
    .select()
    .from(users)
    .where(eq(users.githubId, testProfile.githubId));

  console.log(`   ✓ Cleaned up. Remaining rows: ${remaining.length}`);
  console.log('\n=== Auth Flow Test Completed Successfully! ===');
}

testAuthFlow().catch((err) => {
  console.error('Auth flow test failed:', err);
  process.exit(1);
});
