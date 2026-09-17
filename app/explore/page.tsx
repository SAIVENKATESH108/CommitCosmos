import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Telescope, Star, Flame, ArrowRight, Sparkles, FolderGit2 } from 'lucide-react';
import { getPublicGalaxies } from '@/db/repositories/userRepository';

export const metadata: Metadata = {
  title: 'Explore Galaxies — CommitCosmos',
  description: 'Browse interactive 3D code galaxies crafted by developers around the world.',
};

export const revalidate = 120; // 2 min revalidation

export default async function ExplorePage() {
  const galaxies = await getPublicGalaxies(30);

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#02000a' }}>
      {/* Ambient background glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.16) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-1/4 right-0 w-[600px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]" style={{ background: 'rgba(2,0,10,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#4c1d95,#0e7490)', boxShadow: '0 0 16px rgba(139,92,246,0.35)' }}>
              <Image src="/commitcosmos_logo.png" alt="CommitCosmos" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-white tracking-tight">Commit<span className="text-gradient-cosmic">Cosmos</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="text-xs text-slate-400 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}>
              Observatory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Title banner */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}
          >
            <Telescope className="w-3.5 h-3.5 text-violet-400" />
            <span>Cosmic Registry</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Explore <span className="text-gradient-cosmic">Galaxies</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed" style={{ fontWeight: 350 }}>
            Every developer creates a unique stellar topology. Dive into active galaxies or tour our curated cosmic showcases.
          </p>
        </div>

        {/* Featured Demo Galaxy Banner */}
        <div className="mb-12 rounded-3xl p-6 sm:p-8 relative overflow-hidden group transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(30,10,60,0.6) 0%, rgba(10,20,45,0.6) 100%)',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 10px 40px rgba(124,58,237,0.15)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg"
                style={{ background: 'linear-gradient(135deg,#9333ea,#06b6d4)', color: 'white' }}>
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-violet-300 mb-1"
                  style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  Featured Showcase
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">The Archetype Galaxy</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Explore full constellations, milestone supernovas, and branch orbits without signing in.
                </p>
              </div>
            </div>
            <Link
              href="/u/galaxy-explorer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a855f7, #06b6d4)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}
            >
              <span>Enter Archetype</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Public Galaxies Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Active Cosmonauts</h2>
          <span className="text-xs text-slate-500">{galaxies.length} galaxies charted</span>
        </div>

        {galaxies.length === 0 ? (
          <div className="rounded-3xl p-12 text-center border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-slate-400 text-sm mb-4">No public galaxies found yet. Connect your GitHub repository to be the first!</p>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-semibold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}
            >
              Launch Your Galaxy <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galaxies.map((user) => (
              <Link
                key={user.userId}
                href={`/u/${user.githubUsername}`}
                className="group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={user.githubUsername}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-full object-cover"
                          style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: 'white' }}
                        >
                          {user.githubUsername.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-violet-300 transition-colors">
                          @{user.githubUsername}
                        </h3>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <FolderGit2 className="w-3 h-3" />
                          {user.totalProjects} {user.totalProjects === 1 ? 'repository' : 'repositories'}
                        </span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div
                      className="px-3 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-black text-white">{user.totalCommits}</div>
                        <div className="text-[10px] text-slate-500">Stars</div>
                      </div>
                    </div>

                    <div
                      className="px-3 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-black text-white">{user.currentStreak}d</div>
                        <div className="text-[10px] text-slate-500">Streak</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Record streak: {user.longestStreak} days</span>
                  <span className="text-violet-400 group-hover:underline">Launch Orbit</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CommitCosmos · Built with Three.js & Neon Serverless Postgres</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
