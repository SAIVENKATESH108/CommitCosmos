import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkReadRateLimit } from '@/lib/ratelimit';
import { getUserByUsername } from '@/db/repositories/userRepository';
import { getAllCommitsForUser } from '@/db/repositories/commitRepository';
import { getConstellationsForUser } from '@/db/repositories/constellationRepository';
import { getProjectsForUser } from '@/db/repositories/projectRepository';
import { getStreakForUser } from '@/db/repositories/streakRepository';
import { getBranchesForUser } from '@/db/repositories/branchRepository';
import { getReleasesForUser } from '@/db/repositories/releaseRepository';
import { getClosedIssuesForUser } from '@/db/repositories/issueRepository';
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
    // For brand-new users with zero commits yet, return an embryonic galaxy state
    return NextResponse.json(
      {
        user: {
          id: `new-${username}`,
          githubUsername: username,
          avatarUrl: `https://github.com/${username}.png`,
        },
        totalStars: 0,
        commits: [],
        projects: [],
        branches: [],
        releases: [],
        closedIssues: [],
        constellations: [],
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
        },
        clusters: [],
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      }
    );
  }

  // 4. Fetch commits, constellations, projects, streak, branches, releases, and closed issues in parallel
  const [commitsList, constellationsList, projectsList, streakRecord, branchesList, releasesList, closedIssuesList] =
    await Promise.all([
      getAllCommitsForUser(user.id),
      getConstellationsForUser(user.id),
      getProjectsForUser(user.id),
      getStreakForUser(user.id),
      getBranchesForUser(user.id),
      getReleasesForUser(user.id),
      getClosedIssuesForUser(user.id, 25),
    ]);

  // 5. Shape stars array with deterministic color mapping from language
  const stars = commitsList.map((commit) => ({
    id: commit.id,
    projectId: commit.projectId,
    branchId: commit.branchId ?? null,
    sha: commit.sha,
    message: commit.message,
    language: commit.language,
    color: getStarColorForLanguage(commit.language),
    committedAt: commit.committedAt.toISOString(),
    magnitude: commit.magnitude ?? null,
    isPrMerge: commit.isPrMerge ?? false,
    prNumber: commit.prNumber ?? null,
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
        branchId: c.branchId ?? null,
        sha: c.sha,
        color: getStarColorForLanguage(c.language),
        committedAt: c.committedAt.toISOString(),
        magnitude: c.magnitude ?? null,
        isPrMerge: c.isPrMerge ?? false,
        prNumber: c.prNumber ?? null,
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

  // 8. Format branches conforming to GalaxyBranch
  const formattedBranches = branchesList.map((b) => ({
    id: b.id,
    projectId: b.projectId,
    branchName: b.branchName,
    isDefault: b.isDefault,
    createdAt: b.createdAt.toISOString(),
    mergedAt: b.mergedAt ? b.mergedAt.toISOString() : null,
  }));

  // 9. Format releases conforming to GalaxyRelease
  const formattedReleases = releasesList.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    tagName: r.tagName,
    releaseName: r.releaseName,
    releasedAt: r.releasedAt.toISOString(),
    unlockedAt: r.unlockedAt.toISOString(),
  }));

  // 10. Format commits conforming to GalaxyCommit for query hooks
  const formattedCommits = commitsList.map((commit) => ({
    id: commit.id,
    projectId: commit.projectId,
    branchId: commit.branchId ?? null,
    sha: commit.sha,
    message: commit.message,
    language: commit.language,
    committedAt: commit.committedAt.toISOString(),
    magnitude: commit.magnitude ?? null,
    isPrMerge: commit.isPrMerge ?? false,
    prNumber: commit.prNumber ?? null,
  }));

  // 11. Format closed issues for transient shooting star events
  const formattedClosedIssues = closedIssuesList.map((issue) => ({
    id: issue.id,
    projectId: issue.projectId,
    issueNumber: issue.issueNumber,
    issueTitle: issue.issueTitle,
    closingCommitSha: issue.closingCommitSha,
    closingPrNumber: issue.closingPrNumber,
    closedAt: issue.closedAt.toISOString(),
  }));

  // 12. Return shaped response satisfying GalaxyData and star/cluster specifications
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
    branches: formattedBranches,
    releases: formattedReleases,
    closedIssues: formattedClosedIssues,
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
