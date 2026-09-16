import { and, desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../index';
import { teams, teamMembers, projects, users, type Team, type NewTeam, type TeamMember } from '../schema';

/**
 * ==============================================================================
 * Team Repository
 * ==============================================================================
 * Manages collaborative teams, member rosters, invite codes, and repository ownership.
 * ==============================================================================
 */

export interface TeamMemberWithUser {
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  githubUsername: string;
  avatarUrl: string | null;
}

/**
 * Creates a new team with an auto-generated invite code and assigns the creator as the first member.
 */
export async function createTeam(
  name: string,
  creatorUserId: string,
  customInviteCode?: string
): Promise<Team> {
  const inviteCode = customInviteCode || crypto.randomBytes(6).toString('hex');

  const [team] = await db
    .insert(teams)
    .values({
      name,
      createdBy: creatorUserId,
      inviteCode,
    })
    .returning();

  // Creator automatically joins as 'creator'
  await db
    .insert(teamMembers)
    .values({
      teamId: team.id,
      userId: creatorUserId,
      role: 'creator',
    })
    .onConflictDoNothing();

  return team;
}

/**
 * Retrieves a team by its unique UUID.
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return team || null;
}

/**
 * Retrieves a team by its unique invite code.
 */
export async function getTeamByInviteCode(inviteCode: string): Promise<Team | null> {
  const [team] = await db.select().from(teams).where(eq(teams.inviteCode, inviteCode)).limit(1);
  return team || null;
}

/**
 * Adds a user to a team. Idempotent if user is already a member.
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: string = 'member'
): Promise<TeamMember> {
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  if (existing) return existing;

  const [inserted] = await db
    .insert(teamMembers)
    .values({
      teamId,
      userId,
      role,
    })
    .onConflictDoNothing()
    .returning();

  return inserted;
}

/**
 * Checks if a user is a member of the given team.
 */
export async function isUserInTeam(teamId: string, userId: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1);

  return Boolean(existing);
}

/**
 * Retrieves all members of a team with their user profiles.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
  const rows = await db
    .select({
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      githubUsername: users.githubUsername,
      avatarUrl: users.avatarUrl,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);

  return rows;
}

/**
 * Retrieves all teams a user belongs to.
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      createdBy: teams.createdBy,
      inviteCode: teams.inviteCode,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .orderBy(desc(teams.createdAt));

  return rows;
}

/**
 * Assigns an existing project/repository to a team.
 */
export async function assignProjectToTeam(projectId: string, teamId: string): Promise<void> {
  await db
    .update(projects)
    .set({ teamId })
    .where(eq(projects.id, projectId));
}

/**
 * Retrieves all projects assigned to a team.
 */
export async function getTeamProjects(teamId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.teamId, teamId))
    .orderBy(desc(projects.createdAt));
}
