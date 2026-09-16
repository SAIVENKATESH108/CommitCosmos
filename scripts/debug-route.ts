import { getUserByUsername } from '../db/repositories/userRepository';
import { getAllCommitsForUser } from '../db/repositories/commitRepository';
import { getConstellationsForUser } from '../db/repositories/constellationRepository';
import { getProjectsForUser } from '../db/repositories/projectRepository';
import { getStreakForUser } from '../db/repositories/streakRepository';

async function main() {
  const user = await getUserByUsername('SAIVENKATESH108');
  console.log('User:', user?.id);
  if (!user) return;

  const commitsList = await getAllCommitsForUser(user.id);
  console.log('Commits count:', commitsList.length);
  console.log('Sample commit:', commitsList[0]);

  const constellationsList = await getConstellationsForUser(user.id);
  console.log('Constellations:', constellationsList.length);

  const projectsList = await getProjectsForUser(user.id);
  console.log('Projects:', projectsList.length);

  const streakRecord = await getStreakForUser(user.id);
  console.log('Streak:', streakRecord);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Debug error:', err);
    process.exit(1);
  });
