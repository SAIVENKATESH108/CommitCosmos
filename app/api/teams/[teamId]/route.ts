import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, getTeamMembers, getTeamProjects } from '@/db/repositories/teamRepository';
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

  const [rawMembers, projects] = await Promise.all([
    getTeamMembers(teamId),
    getTeamProjects(teamId),
  ]);

  const members = rawMembers.map((m, index) => ({
    userId: m.userId,
    githubUsername: m.githubUsername,
    avatarUrl: m.avatarUrl,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    color: getTeamMemberColor(m.githubUsername, index),
  }));

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      createdAt: team.createdAt.toISOString(),
    },
    members,
    projects: projects.map((p) => ({
      id: p.id,
      repoName: p.repoName,
      repoUrl: p.repoUrl,
    })),
  });
}
