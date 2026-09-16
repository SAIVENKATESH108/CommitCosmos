import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, getTeamMembers, getTeamProjects } from '@/db/repositories/teamRepository';
import { getAllCommitsForTeam } from '@/db/repositories/commitRepository';
import { getTeamMemberColor } from '@/lib/galaxy/teamColors';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;
  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const [rawMembers, projects, commitsList] = await Promise.all([
    getTeamMembers(teamId),
    getTeamProjects(teamId),
    getAllCommitsForTeam(teamId),
  ]);

  // Build member color map
  const memberColorMap = new Map<string, string>();
  const members = rawMembers.map((m, index) => {
    const color = getTeamMemberColor(m.githubUsername, index);
    memberColorMap.set(m.githubUsername.toLowerCase(), color);
    return {
      userId: m.userId,
      githubUsername: m.githubUsername,
      avatarUrl: m.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      color,
    };
  });

  // Format commits with authorColor
  const formattedCommits = commitsList.map((c) => {
    const authorLower = (c.authorUsername || '').toLowerCase();
    const authorColor = memberColorMap.get(authorLower) || getTeamMemberColor(c.authorUsername);
    return {
      id: c.id,
      projectId: c.projectId,
      branchId: c.branchId ?? null,
      sha: c.sha,
      message: c.message,
      language: c.language,
      committedAt: c.committedAt.toISOString(),
      magnitude: c.magnitude ?? null,
      isPrMerge: c.isPrMerge ?? false,
      prNumber: c.prNumber ?? null,
      authorUsername: c.authorUsername ?? 'collaborator',
      authorAvatarUrl: c.authorAvatarUrl,
      authorColor,
    };
  });

  // Shape stars with author color (instead of language spectral color)
  const stars = formattedCommits.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    branchId: c.branchId ?? null,
    sha: c.sha,
    message: c.message,
    language: c.language,
    color: c.authorColor,
    committedAt: c.committedAt,
    magnitude: c.magnitude ?? null,
    isPrMerge: c.isPrMerge ?? false,
    prNumber: c.prNumber ?? null,
    authorUsername: c.authorUsername,
    authorAvatarUrl: c.authorAvatarUrl,
  }));

  // Shape clusters by project
  const commitsByProject = new Map<string, typeof formattedCommits>();
  for (const commit of formattedCommits) {
    const list = commitsByProject.get(commit.projectId) || [];
    list.push(commit);
    commitsByProject.set(commit.projectId, list);
  }

  const clusters = projects.map((project) => {
    const pCommits = commitsByProject.get(project.id) || [];
    return {
      id: project.id,
      repoName: project.repoName,
      repoUrl: project.repoUrl,
      starCount: pCommits.length,
      stars: pCommits.map((c) => ({
        id: c.id,
        branchId: c.branchId ?? null,
        sha: c.sha,
        color: c.authorColor,
        committedAt: c.committedAt,
        magnitude: c.magnitude ?? null,
        isPrMerge: c.isPrMerge ?? false,
        prNumber: c.prNumber ?? null,
        authorUsername: c.authorUsername,
      })),
    };
  });

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
    },
    user: {
      id: team.id,
      githubUsername: team.name,
      avatarUrl: null,
    },
    members,
    projects: projects.map((p) => ({
      id: p.id,
      repoName: p.repoName,
      repoUrl: p.repoUrl,
    })),
    commits: formattedCommits,
    stars,
    clusters,
    totalStars: stars.length,
    isTeamMode: true,
  });
}
