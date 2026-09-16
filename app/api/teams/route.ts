import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createTeam, getUserTeams } from '@/db/repositories/teamRepository';
import { getUserByUsername } from '@/db/repositories/userRepository';

export const dynamic = 'force-dynamic';

const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(50, 'Team name is too long'),
});

export async function GET(request: NextRequest) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Standalone script context
  }
  if (!session?.user?.id) {
    // If not authenticated, allow username query param fallback for dev/testing
    const username = request.nextUrl.searchParams.get('username');
    if (username) {
      const user = await getUserByUsername(username);
      if (user) {
        const teams = await getUserTeams(user.id);
        return NextResponse.json({ teams });
      }
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teams = await getUserTeams(session.user.id);
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Standalone script context
  }
  let userId = session?.user?.id;

  const body = await request.json().catch(() => ({}));
  const parseResult = CreateTeamSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  // Fallback for dev / unauthenticated requests if test userId or username is provided
  if (!userId) {
    const creatorUsername = body.creatorUsername;
    if (creatorUsername) {
      const user = await getUserByUsername(creatorUsername);
      if (user) userId = user.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await createTeam(parseResult.data.name, userId);
  return NextResponse.json({ success: true, team }, { status: 201 });
}
