import { getCurrentUser } from '@/lib/auth';
import { getUserStats } from '@/db/repositories/userRepository';
import { getProjectsForUser } from '@/db/repositories/projectRepository';
import { SignOutButton } from '@/components/auth/SignOutButton';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, GitCommit, FolderGit2, Trophy } from 'lucide-react';

export default async function DashboardPage() {
  // Protected route: redirects to /sign-in if unauthenticated
  const user = await getCurrentUser(true);
  if (!user) return null;

  const [stats, projects] = await Promise.all([
    getUserStats(user.githubUsername),
    getProjectsForUser(user.id),
  ]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold tracking-tight text-white">CommitCosmos</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.githubUsername || 'Avatar'}
                  width={28}
                  height={28}
                  className="rounded-full border border-slate-700"
                />
              )}
              <span className="text-xs font-medium text-slate-300">
                @{user.githubUsername}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Cosmic Observatory
          </h1>
          <p className="text-sm text-slate-400">
            Welcome back, @{user.githubUsername}. Your celestial commit stats and star constellation metrics.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Current Streak</span>
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {stats?.currentStreak ?? 0} <span className="text-xs font-normal text-slate-400">days</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Longest Streak</span>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {stats?.longestStreak ?? 0} <span className="text-xs font-normal text-slate-400">days</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Commits</span>
              <GitCommit className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {stats?.totalCommits ?? 0} <span className="text-xs font-normal text-slate-400">stars</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Connected Repos</span>
              <FolderGit2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {stats?.totalProjects ?? projects.length}
            </div>
          </div>
        </div>

        {/* Repositories section */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Connected Star Clusters (Repositories)
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
              <p className="text-sm text-slate-400">
                No repositories connected yet. In the next step, you will be able to register webhooks to stream commits into your galaxy!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/30 p-4"
                >
                  <p className="font-medium text-white">{proj.repoName}</p>
                  <p className="text-xs text-slate-400">{proj.repoUrl}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
