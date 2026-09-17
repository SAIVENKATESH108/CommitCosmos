import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByUsername } from '@/db/repositories/userRepository';
import { createProject, getProjectsForUser } from '@/db/repositories/projectRepository';
import { insertCommit } from '@/db/repositories/commitRepository';
import { createOrGetBranch } from '@/db/repositories/branchRepository';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for batch repo sync

export async function POST(request: NextRequest) {
  const session = await auth();
  let username = session?.user?.githubUsername;
  let userId = session?.user?.id;
  const accessToken = session?.accessToken;

  // Fallback: accept JSON body with username if triggered by user
  if (!username) {
    try {
      const body = await request.json();
      if (body?.username) {
        username = String(body.username);
      }
    } catch {
      // ignore
    }
  }

  if (!username) {
    return NextResponse.json(
      { error: 'Unauthorized: Sign in or provide a valid GitHub username' },
      { status: 401 }
    );
  }

  if (!userId) {
    const dbUser = await getUserByUsername(username);
    if (!dbUser) {
      return NextResponse.json(
        { error: `User @${username} not found in database` },
        { status: 404 }
      );
    }
    userId = dbUser.id;
  }

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'CommitCosmos-SyncEngine/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Fetch user repositories from GitHub API
    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`;
    let reposRes = await fetch(reposUrl, { headers });

    // If authenticated request failed (e.g. 401 token expired/invalid), retry as public request
    if (!reposRes.ok && headers.Authorization) {
      delete headers.Authorization;
      reposRes = await fetch(reposUrl, { headers });
    }

    if (!reposRes.ok) {
      // Fallback gracefully to existing projects in database if GitHub API rate limits
      const currentProjects = await getProjectsForUser(userId);
      return NextResponse.json({
        success: true,
        message: `GitHub API temporarily busy. Tracking ${currentProjects.length} existing repositories in database.`,
        syncedProjects: currentProjects.length,
        syncedCommits: 0,
        totalProjects: currentProjects.length,
        projects: currentProjects,
      });
    }

    const repos = await reposRes.json();
    if (!Array.isArray(repos)) {
      const currentProjects = await getProjectsForUser(userId);
      return NextResponse.json({
        success: true,
        message: `Tracking ${currentProjects.length} repositories in database.`,
        syncedProjects: currentProjects.length,
        syncedCommits: 0,
        totalProjects: currentProjects.length,
        projects: currentProjects,
      });
    }

    let syncedProjects = 0;
    let syncedCommits = 0;

    for (const repo of repos) {
      const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;
      const repoName = repo.name;
      const defaultBranch = repo.default_branch || 'main';

      const project = await createProject(userId, repoUrl, repoName);
      syncedProjects += 1;

      const branch = await createOrGetBranch(project.id, defaultBranch, true);

      // Fetch recent commits (last 15 commits)
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${username}/${repoName}/commits?per_page=15`,
          { headers }
        );

        if (commitsRes.ok) {
          const commitsList = await commitsRes.json();
          if (Array.isArray(commitsList)) {
            for (const c of commitsList) {
              const sha = c.sha;
              const message = c.commit?.message || 'No commit message';
              const committedAt = c.commit?.author?.date
                ? new Date(c.commit.author.date)
                : new Date();
              const authorUsername = c.author?.login || c.commit?.author?.name || username;
              const authorAvatarUrl = c.author?.avatar_url || `https://github.com/${username}.png`;

              await insertCommit(
                project.id,
                sha,
                message,
                repo.language || null,
                committedAt,
                3,
                branch.id,
                false,
                null,
                authorUsername,
                authorAvatarUrl
              );
              syncedCommits += 1;
            }
          }
        }
      } catch (err) {
        console.warn(`[Sync API] Error fetching commits for ${repoName}:`, err);
      }
    }

    const updatedProjects = await getProjectsForUser(userId);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${syncedProjects} repositories and ${syncedCommits} commits.`,
      syncedProjects,
      syncedCommits,
      totalProjects: updatedProjects.length,
      projects: updatedProjects,
    });
  } catch (error) {
    console.error('[Sync API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal server error while synchronizing repositories' },
      { status: 500 }
    );
  }
}
