import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkReadRateLimit } from '@/lib/ratelimit';
import { getUserByUsername } from '@/db/repositories/userRepository';
import { getAllCommitsForUser } from '@/db/repositories/commitRepository';
import { getConstellationsForUser } from '@/db/repositories/constellationRepository';
import { getProjectsForUser } from '@/db/repositories/projectRepository';
import { getStreakForUser } from '@/db/repositories/streakRepository';
import { getStarColorForLanguage } from '@/lib/starColors';

export const dynamic = 'force-dynamic';

// Validation schema for the username path parameter: 1-39 chars, alphanumeric with single hyphens (GitHub username spec)
const UsernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(39, 'Username exceeds GitHub max length of 39 characters')
  .regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
    'Invalid username format'
  );

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  // 1. Rate Limiting (30 requests / 60 seconds sliding window per IP)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  const rateLimitResult = await checkReadRateLimit(clientIp);
  if (!rateLimitResult.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  // 2. Validate username path parameter with Zod
  const validation = UsernameSchema.safeParse(params.username);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid username parameter', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const username = validation.data;

  // 3. Resolve username to user record via repository layer
  const user = await getUserByUsername(username);
  if (!user) {
    return NextResponse.json(
      { error: `User '${username}' not found` },
      { status: 404 }
    );
  }

  // 4. Fetch commits, constellations, projects, and streak in parallel
  const [commitsList, constellationsList, projectsList, streakRecord] =
    await Promise.all([
      getAllCommitsForUser(user.id),
      getConstellationsForUser(user.id),
      getProjectsForUser(user.id),
      getStreakForUser(user.id),
    ]);

  // 5. Shape stars array with deterministic color mapping from language
  const stars = commitsList.map((commit) => ({
    id: commit.id,
    sha: commit.sha,
    color: getStarColorForLanguage(commit.language),
    committedAt: commit.committedAt.toISOString(),
  }));

  // 6. Shape clusters grouped by project
  const commitsByProject = new Map<string, typeof commitsList>();
  for (const commit of commitsList) {
    const list = commitsByProject.get(commit.projectId) || [];
    list.push(commit);
    commitsByProject.set(commit.projectId, list);
  }

  const clusters = projectsList.map((project) => {
    const projectCommits = commitsByProject.get(project.id) || [];
    return {
      id: project.id,
      repoName: project.repoName,
      repoUrl: project.repoUrl,
      starCount: projectCommits.length,
      stars: projectCommits.map((c) => ({
        id: c.id,
        sha: c.sha,
        color: getStarColorForLanguage(c.language),
        committedAt: c.committedAt.toISOString(),
      })),
    };
  });

  // 7. Format constellations
  const constellationsFormatted = constellationsList.map((c) => ({
    id: c.id,
    name: c.name,
    streakLength: c.streakLength,
    unlockedAt: c.unlockedAt.toISOString(),
  }));

  // 8. Format commits conforming to GalaxyCommit for query hooks
  const formattedCommits = commitsList.map((commit) => ({
    id: commit.id,
    projectId: commit.projectId,
    sha: commit.sha,
    message: commit.message,
    language: commit.language,
    committedAt: commit.committedAt.toISOString(),
  }));

  // 9. Return shaped response satisfying GalaxyData and star/cluster specifications
  return NextResponse.json({
    user: {
      id: user.id,
      githubUsername: user.githubUsername,
      avatarUrl: user.avatarUrl,
    },
    stars,
    clusters,
    projects: projectsList.map((p) => ({
      id: p.id,
      repoName: p.repoName,
      repoUrl: p.repoUrl,
    })),
    commits: formattedCommits,
    streak: streakRecord
      ? {
          currentStreak: streakRecord.currentStreak,
          longestStreak: streakRecord.longestStreak,
          lastActiveDate: streakRecord.lastActiveDate,
        }
      : null,
    constellations: constellationsFormatted,
    totalStars: stars.length,
  });
}
