import { getCurrentUser } from '@/lib/auth';
import { getUserStats } from '@/db/repositories/userRepository';
import { getProjectsForUser } from '@/db/repositories/projectRepository';
import { getConstellationsForUser } from '@/db/repositories/constellationRepository';
import { getAllCommitsForUser } from '@/db/repositories/commitRepository';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cosmic Observatory Dashboard',
  description: 'Manage your connected star clusters, webhooks, and celestial streak metrics.',
};

export default async function DashboardPage() {
  // Protected route: redirects to /sign-in if unauthenticated
  const user = await getCurrentUser(true);
  if (!user) return null;

  const [stats, projects, constellations, allCommits] = await Promise.all([
    getUserStats(user.githubUsername),
    getProjectsForUser(user.id),
    getConstellationsForUser(user.id),
    getAllCommitsForUser(user.id),
  ]);

  const productionUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://commitcosmos.vercel.app';
  const webhookSecret =
    process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  return (
    <DashboardClient
      user={user}
      stats={stats}
      projects={projects}
      constellations={constellations}
      recentCommits={allCommits}
      productionUrl={productionUrl}
      webhookSecret={webhookSecret}
    />
  );
}
