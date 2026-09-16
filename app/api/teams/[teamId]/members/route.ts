import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import {
  getTeamById,
  addTeamMember,
  getTeamMembers,
  isUserInTeam,
} from '@/db/repositories/teamRepository';
import { getUserByUsername, createOrUpdateUserFromGitHub } from '@/db/repositories/userRepository';
import { getTeamMemberColor } from '@/lib/galaxy/teamColors';

export const dynamic = 'force-dynamic';

const AddMemberSchema = z.object({
  githubUsername: z
    .string()
    .min(1, 'GitHub username is required')
    .max(39)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;
  const team = await getTeamById(teamId);
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Auth gate: verify current session
  let session = null;
  try {
    session = await auth();
  } catch {
    // Standalone script context
  }
  const currentUserId = session?.user?.id;

  // If user is authenticated, ensure they belong to this team to invite others
  if (currentUserId) {
    const isMember = await isUserInTeam(teamId, currentUserId);
    if (!isMember && team.createdBy !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: You must be a team member to invite collaborators' }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = AddMemberSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const cleanUsername = parseResult.data.githubUsername.trim().toLowerCase();

  // Look up user or provision invite placeholder
  let user = await getUserByUsername(cleanUsername);
  if (!user) {
    let dummyId = 0;
    for (let i = 0; i < cleanUsername.length; i++) {
      dummyId = (dummyId << 5) - dummyId + cleanUsername.charCodeAt(i);
      dummyId |= 0;
    }
    dummyId = Math.abs(dummyId) + 1000000;

    user = await createOrUpdateUserFromGitHub({
      githubId: dummyId,
      githubUsername: cleanUsername,
      avatarUrl: `https://github.com/${cleanUsername}.png`,
    });
  }

  await addTeamMember(teamId, user.id, 'member');

  // Return fresh member roster
  const rawMembers = await getTeamMembers(teamId);
  const members = rawMembers.map((m, index) => ({
    userId: m.userId,
    githubUsername: m.githubUsername,
    avatarUrl: m.avatarUrl,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    color: getTeamMemberColor(m.githubUsername, index),
  }));

  return NextResponse.json({
    success: true,
    message: `@${cleanUsername} added to team ${team.name}`,
    members,
  });
}
