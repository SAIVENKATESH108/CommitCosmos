import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db, users } from '../db';
import { createProject, getProjectsForUser } from '../db/repositories/projectRepository';
import { insertCommit } from '../db/repositories/commitRepository';
import { createOrGetBranch } from '../db/repositories/branchRepository';
import { eq } from 'drizzle-orm';

async function syncAll() {
  console.log('--- Starting GitHub Repository Sync for SAIVENKATESH108 ---');

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubUsername, 'SAIVENKATESH108'))
    .limit(1);

  if (!user) {
    console.error('User SAIVENKATESH108 not found in database!');
    process.exit(1);
  }

  console.log(`Found user: ${user.githubUsername} (${user.id})`);

  // Fetch all repositories from GitHub API
  const res = await fetch('https://api.github.com/users/SAIVENKATESH108/repos?per_page=100&sort=updated', {
    headers: {
      'User-Agent': 'CommitCosmos-Sync',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch repos from GitHub API:', res.status, res.statusText);
    process.exit(1);
  }

  const repos = await res.json();
  console.log(`Fetched ${repos.length} repositories from GitHub API.`);

  let totalProjectsSynced = 0;
  let totalCommitsSynced = 0;

  for (const repo of repos) {
    const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;
    const repoName = repo.name;
    const defaultBranch = repo.default_branch || 'main';

    console.log(`\nSyncing project: ${repo.full_name}...`);
    const project = await createProject(user.id, repoUrl, repoName);
    totalProjectsSynced += 1;

    // Create default branch
    const branch = await createOrGetBranch(project.id, defaultBranch, true);

    // Fetch last 15 commits for this repo
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/SAIVENKATESH108/${repoName}/commits?per_page=15`,
        {
          headers: {
            'User-Agent': 'CommitCosmos-Sync',
          },
        }
      );

      if (commitsRes.ok) {
        const commitList = await commitsRes.json();
        if (Array.isArray(commitList)) {
          console.log(`  Found ${commitList.length} commits for ${repoName}. Ingesting...`);
          for (const c of commitList) {
            const sha = c.sha;
            const message = c.commit?.message || 'No commit message';
            const committedAt = c.commit?.author?.date ? new Date(c.commit.author.date) : new Date();
            const authorUsername = c.author?.login || c.commit?.author?.name || user.githubUsername;
            const authorAvatarUrl = c.author?.avatar_url || user.avatarUrl;

            await insertCommit(
              project.id,
              sha,
              message,
              repo.language || null,
              committedAt,
              3, // default magnitude
              branch.id,
              false,
              null,
              authorUsername,
              authorAvatarUrl
            );
            totalCommitsSynced += 1;
          }
        }
      } else {
        console.log(`  Could not fetch commits for ${repoName}: ${commitsRes.status}`);
      }
    } catch (err) {
      console.warn(`  Warning fetching commits for ${repoName}:`, err);
    }
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Total projects synced: ${totalProjectsSynced}`);
  console.log(`Total commits synced: ${totalCommitsSynced}`);

  const userProjects = await getProjectsForUser(user.id);
  console.log(`User now has ${userProjects.length} projects in DB.`);

  process.exit(0);
}

syncAll().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
