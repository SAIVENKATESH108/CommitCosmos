import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Database,
  Lock,
  Zap,
  Sparkles,
  ArrowRight,
  Terminal,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — Architecture of CommitCosmos',
  description: 'Deep-dive into the Three.js visual computing engine, Neon Postgres pipeline, and GitHub webhook synchronization behind CommitCosmos.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ background: '#02000a' }}>
      {/* Ambient backgrounds */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(90px)' }}
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
            <Link href="/explore" className="text-xs text-slate-400 hover:text-white transition-colors">Explore</Link>
            <Link href="/leaderboard" className="text-xs text-slate-400 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}>
              Observatory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-20 flex-1">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}
          >
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span>Under the Hood</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            How CommitCosmos <br /><span className="text-gradient-cosmic">Maps Code to Stars</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed" style={{ fontWeight: 350 }}>
            An engineering overview of our real-time telemetry pipeline, deterministic cosmic projection algorithms, and WebGL rendering layer.
          </p>
        </div>

        {/* 4 Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Pillar 1 */}
          <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Zap className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">1. Real-Time Telemetry & Webhooks</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed" style={{ fontWeight: 350 }}>
              Whenever you push commits, merge pull requests, or deploy releases, GitHub transmits payload bursts via authenticated webhooks. Each request verifies against an HMAC-SHA256 signature secret (<code className="text-violet-300">x-hub-signature-256</code>) with idempotent deduplication.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <Database className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">2. Neon Serverless Postgres Engine</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed" style={{ fontWeight: 350 }}>
              Backed by Neon Lakebase Postgres using Drizzle ORM. Commits, branches, and milestones are parsed and stored in relational schemas. A materializing SQL view (<code className="text-cyan-300">user_stats_view</code>) pre-aggregates streaks and star totals for lightning-fast queries.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">3. Deterministic Astronomical Projection</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed" style={{ fontWeight: 350 }}>
              Commit hashes are mapped deterministically into spherical coordinates (Right Ascension & Declination). Active branches form concentric planetary orbital rings, while releases expand into glowing supernova remnant nebulae.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">4. Least-Privilege Security</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed" style={{ fontWeight: 350 }}>
              CommitCosmos never requests write access to your code repository. The GitHub OAuth scope is restricted strictly to read-only commit metadata and webhook creation. Access tokens are encrypted and retained strictly server-side.
            </p>
          </div>
        </div>

        {/* Constellation Algorithm Deep-Dive */}
        <div className="rounded-3xl p-8 sm:p-10 mb-16 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(20,10,45,0.7) 0%, rgba(10,25,50,0.7) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2 block">Algorithm Spotlight</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Streak Constellation Synthesis</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6" style={{ fontWeight: 350 }}>
              CommitCosmos tracks contiguous UTC calendar days of commit activity. When your streak passes threshold intervals (3, 7, 14, 30+ days), our geometry pipeline joins sequential commits with glowing gravitational filaments, christening custom constellations named after celestial figures.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-lg font-bold text-white">3 Days</div>
                <div className="text-[11px] text-violet-400">Triangulum</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-lg font-bold text-white">7 Days</div>
                <div className="text-[11px] text-cyan-400">Septentrion</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-lg font-bold text-white">14 Days</div>
                <div className="text-[11px] text-amber-400">Orion Flare</div>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-lg font-bold text-white">30+ Days</div>
                <div className="text-[11px] text-emerald-400">Cassiopeia Crown</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="text-center py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to illuminate your galaxy?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/u/galaxy-explorer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Explore Live Demo
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
            >
              <span>Connect GitHub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CommitCosmos · Built with Three.js & Neon Serverless Postgres</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
