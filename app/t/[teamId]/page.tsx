import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTeamById } from '@/db/repositories/teamRepository';
import { TeamGalaxyClient } from '@/components/galaxy/TeamGalaxyClient';

interface TeamPageProps {
  params: {
    teamId: string;
  };
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const team = await getTeamById(params.teamId);
  const name = team?.name || 'Team';

  return {
    title: `${name} | Team Star System · CommitCosmos`,
    description: `Explore ${name}'s collaborative multi-author GitHub celestial star system on CommitCosmos.`,
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await auth();
  const team = await getTeamById(params.teamId);

  if (!team) {
    notFound();
  }

  return (
    <TeamGalaxyClient
      teamId={params.teamId}
      sessionUser={session?.user || null}
    />
  );
}
