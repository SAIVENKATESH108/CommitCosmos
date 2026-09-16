import { auth } from '@/lib/auth';
import { SignInButton } from '@/components/auth/SignInButton';
import { SignOutButton } from '@/components/auth/SignOutButton';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  GitCommit,
  Flame,
  Globe2,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-black text-slate-100 overflow-x-hidden flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Celestial Nebulae */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px] -translate-y-48" />
        <div className="h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[130px] translate-y-36 -translate-x-48" />
        <div className="h-[350px] w-[350px] rounded-full bg-purple-600/10 blur-[120px] translate-y-48 translate-x-48" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/40 shadow-lg shadow-indigo-500/20 bg-black">
              <Image
                src="/commitcosmos_logo.png"
                alt="CommitCosmos Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg">
              CommitCosmos
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/u/${session.user.githubUsername || 'cosmonaut'}`}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                >
                  My Galaxy
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 shadow-sm transition-colors"
                >
                  <span>Observatory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/u/galaxy-explorer"
                  className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Explore Demo
                </Link>
                <SignInButton />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center flex flex-col items-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-sm mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>First Commit Hackathon &bull; Devpost 2026</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
          Grow your coding journey into a{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            living 3D galaxy
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Every Git push illuminates a glowing star. Every daily commit streak weaves an ancient constellation.
          Explore your engineering legacy across interactive Three.js star clusters or accessible tabular views.
        </p>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          {session?.user ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href={`/u/${session.user.githubUsername || 'cosmonaut'}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all"
              >
                <span>View Your 3D Galaxy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                <span>Manage Observatories</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <SignInButton className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-600/25" />
              <p className="text-[11px] text-slate-500">
                🔒 Minimum read-only OAuth permissions &bull; Zero repository write access
              </p>
            </div>
          )}
        </div>

        {/* 3D Galaxy Banner Showcase */}
        <div className="mt-14 w-full max-w-4xl relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-600 opacity-20 blur-xl group-hover:opacity-35 transition duration-1000" />
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-950/80 overflow-hidden shadow-2xl backdrop-blur-sm">
            <Image
              src="/commitcosmos_banner.png"
              alt="CommitCosmos 3D Galaxy Visualization Interface"
              width={1200}
              height={630}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>

        {/* Feature Demonstration Pillars */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          {/* Pillar 1: Commits to Stars */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <GitCommit className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Commits Ignite Stars</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time GitHub push webhooks ingest your commits within seconds. Each star inherits a spectral color determined deterministically by your commit language.
            </p>
          </div>

          {/* Pillar 2: Streaks to Constellations */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Streaks Forge Constellations</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consecutive daily commit activity weaves shining starlight connectors. Reaching 7-day weekly streaks unlocks completed mythic constellations.
            </p>
          </div>

          {/* Pillar 3: Accessibility & Universal Design */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Globe2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Dual 3D & 2D Accessible Views</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full WCAG AA parity: users with motion sensitivity or screen readers can toggle seamlessly from WebGL orbit controls to a semantic tabular report.
            </p>
          </div>
        </div>

        {/* Interactive Architecture Highlights */}
        <section className="mt-16 w-full rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 sm:p-8 backdrop-blur-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Under the Hood Architecture</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineered with production-grade backend isolation, mathematical distribution, and cloud primitives.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-[11px] font-mono">
                TypeScript Strict
              </span>
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[11px] font-mono">
                Neon Postgres
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="flex items-start gap-3">
              <Layers className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block font-semibold">Repository Pattern</strong>
                <span className="text-slate-400">Zero raw SQL in API routes. Drizzle ORM queries are 100% encapsulated.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block font-semibold">Fibonacci Sphere Placement</strong>
                <span className="text-slate-400">Golden-angle spiral algorithm positions stars with isotropic, clump-free spacing.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block font-semibold">Defense-in-Depth</strong>
                <span className="text-slate-400">HMAC-SHA256 webhooks, Upstash sliding window rate limits, and non-wildcard CSP.</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; 2026 CommitCosmos &bull; Built for First Commit Hackathon (Devpost)</p>
          <div className="flex items-center gap-4">
            <Link href="/u/galaxy-explorer" className="hover:text-slate-300 transition-colors">
              Sample Galaxy
            </Link>
            <Link href="/api/og?username=demo&totalCommits=128&currentStreak=14" className="hover:text-slate-300 transition-colors">
              Social Card Preview
            </Link>
            <a
              href="https://github.com/SAIVENKATESH108/CommitCosmos"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
