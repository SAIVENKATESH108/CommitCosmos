import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Star, Trophy, ArrowRight, Users } from 'lucide-react';
import { getLeaderboard } from '@/db/repositories/userRepository';

export const metadata: Metadata = {
  title: 'Leaderboard — top coding galaxies',
  description: 'See who has the longest commit streaks and brightest galaxies on CommitCosmos.',
};

export const revalidate = 120; // Revalidate every 2 minutes

export default async function LeaderboardPage() {
  const [byStreak, byStars] = await Promise.all([
    getLeaderboard(20, 'streak'),
    getLeaderboard(20, 'stars'),
  ]);

  return (
    <div className="min-h-screen" style={{ background: '#02000a' }}>
      {/* Ambient bg */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.14) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.06]" style={{ background: 'rgba(2,0,10,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#4c1d95,#0e7490)', boxShadow: '0 0 14px rgba(139,92,246,0.35)' }}>
              <Image src="/commitcosmos_logo.png" alt="CommitCosmos" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-white tracking-tight">Commit<span className="text-gradient-cosmic">Cosmos</span></span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/explore" className="text-xs text-slate-400 hover:text-white transition-colors">Explore</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}>
              Observatory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
            <Users className="w-3.5 h-3.5" />
            <span>Community Rankings</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            The <span className="text-gradient-cosmic">Cosmos</span> Leaderboard
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto" style={{ fontWeight: 350 }}>
            The brightest stars and longest streaks in the CommitCosmos universe.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Streak leaderboard */}
          <LeaderboardTable
            title="🔥 Longest Streak"
            subtitle="Consecutive days of commits"
            entries={byStreak}
            valueKey="streak"
          />
          {/* Stars leaderboard */}
          <LeaderboardTable
            title="⭐ Most Stars"
            subtitle="Total commits across all repos"
            entries={byStars}
            valueKey="stars"
          />
        </div>
      </main>
    </div>
  );
}

function LeaderboardTable({
  title, subtitle, entries, valueKey,
}: {
  title: string;
  subtitle: string;
  entries: Awaited<ReturnType<typeof getLeaderboard>>;
  valueKey: 'streak' | 'stars';
}) {
  const isEmpty = entries.length === 0;

  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.07]">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {isEmpty ? (
        <div className="px-6 py-12 text-center">
          <p className="text-slate-500 text-sm">No entries yet. Be the first!</p>
          <Link href="/sign-in" className="mt-4 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Connect your GitHub <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {entries.map((entry) => {
            const value = valueKey === 'streak' ? entry.currentStreak : entry.totalCommits;
            const unit = valueKey === 'streak' ? (entry.currentStreak === 1 ? 'day' : 'days') : (entry.totalCommits === 1 ? 'star' : 'stars');
            const rankStyle =
              entry.rank === 1 ? { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' } :
              entry.rank === 2 ? { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' } :
              entry.rank === 3 ? { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' } :
              { color: '#475569', bg: 'transparent', border: 'transparent' };

            return (
              <li key={entry.userId}>
                <Link href={`/u/${entry.githubUsername}`}
                  className="flex items-center justify-between px-6 py-4 transition-all hover:bg-white/[0.04] group">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                      style={{ background: rankStyle.bg, border: `1px solid ${rankStyle.border}`, color: rankStyle.color }}>
                      {entry.rank <= 3
                        ? entry.rank === 1 ? <Trophy className="w-4 h-4" /> : entry.rank === 2 ? <Star className="w-4 h-4" /> : <Flame className="w-4 h-4" />
                        : entry.rank}
                    </div>
                    {/* Avatar */}
                    {entry.avatarUrl ? (
                      <Image src={entry.avatarUrl} alt={entry.githubUsername} width={36} height={36}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }} unoptimized />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: 'white' }}>
                        {entry.githubUsername.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                        @{entry.githubUsername}
                      </span>
                      <span className="block text-[11px] text-slate-500">{entry.totalProjects} repos connected</span>
                    </div>
                  </div>
                  {/* Value */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg font-black" style={{ color: entry.rank === 1 ? '#fbbf24' : 'white' }}>
                      {value}
                    </span>
                    <span className="text-xs text-slate-500">{unit}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
