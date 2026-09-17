import { getCurrentUser } from '@/lib/auth';
import { getUserStats } from '@/db/repositories/userRepository';
import { SettingsClient } from '@/components/settings/SettingsClient';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Cosmic Settings & Preferences | CommitCosmos',
  description: 'Manage your visual rendering options, repository webhooks, and developer identity.',
};

export default async function SettingsPage() {
  const user = await getCurrentUser(true);
  if (!user) {
    redirect('/sign-in');
  }

  const stats = await getUserStats(user.githubUsername);

  const productionUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://commitcosmos.vercel.app';
  const webhookSecret =
    process.env.GITHUB_WEBHOOK_SECRET || 'cosmos_secret_dev_2026_webhook';

  return (
    <SettingsClient
      user={user}
      stats={stats}
      productionUrl={productionUrl}
      webhookSecret={webhookSecret}
    />
  );
}
