import { db } from '../db';
import { commits, projects, users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubUsername, 'SAIVENKATESH108'))
    .limit(1);

  if (!user) {
    console.error('User SAIVENKATESH108 not found');
    return;
  }
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .limit(1);

  if (!project) {
    console.error('Project not found');
    return;
  }

  const realCommits = [
    {
      sha: '6c0dbdceb2d1b46a7aa2e752274959b01c73bb6c',
      message: 'fix(server): resolve webpack cache desync, fix Satori OG styles, and integrate public brand assets',
      language: 'TypeScript',
      committedAt: new Date('2026-09-15T18:31:14+05:30'),
    },
    {
      sha: '601ca5e40a0af53ef0f0838826156e3a8341911e',
      message: 'feat(state): implement client state split with Zustand (UI) and TanStack Query (server state)',
      language: 'TypeScript',
      committedAt: new Date('2026-09-15T14:39:37+05:30'),
    },
    {
      sha: '29b9bfaf157b8389d5a41f08f8bb15b4c6437c77',
      message: 'feat(webhook): implement defensive GitHub push webhook with rate limiting, HMAC-SHA256, and commit ingestion',
      language: 'TypeScript',
      committedAt: new Date('2026-09-15T14:27:24+05:30'),
    },
    {
      sha: '7ddc9fa48089ca1bb042726cbf4969a83ae380f7',
      message: 'feat(auth): configure NextAuth v5 with GitHub OAuth, repository upsert, secure cookies, and protected routes',
      language: 'TypeScript',
      committedAt: new Date('2026-09-15T14:15:05+05:30'),
    },
    {
      sha: 'fcde622a20db975e82f744ea75d4c4d118a1e87c',
      message: 'feat(db): implement strongly-typed repository layer for users, projects, commits, streaks, and constellations',
      language: 'TypeScript',
      committedAt: new Date('2026-09-15T13:53:15+05:30'),
    },
    {
      sha: '10b287fa923d0f42ebb395f0023e14f667fa6b85',
      message: 'feat(db): implement full Drizzle schema, singleton client, streak trigger, and view',
      language: 'SQL',
      committedAt: new Date('2026-09-15T13:42:43+05:30'),
    },
  ];

  for (const c of realCommits) {
    const existing = await db
      .select()
      .from(commits)
      .where(eq(commits.sha, c.sha))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(commits).values({
        projectId: project.id,
        sha: c.sha,
        message: c.message,
        language: c.language,
        committedAt: c.committedAt,
      });
      console.log('Inserted real commit:', c.sha.slice(0, 7), c.message.slice(0, 40));
    } else {
      console.log('Already exists:', c.sha.slice(0, 7));
    }
  }

  const allCommits = await db
    .select()
    .from(commits)
    .where(eq(commits.projectId, project.id));
  console.log('Total commits in DB for project:', allCommits.length);
}

main().then(() => process.exit(0));
