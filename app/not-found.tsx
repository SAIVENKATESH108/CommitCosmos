import Link from 'next/link';
import Image from 'next/image';
import { Compass, Home, Telescope } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden" style={{ background: '#02000a' }}>
      {/* Ambient background glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }}
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
          <Link href="/explore" className="text-xs text-slate-400 hover:text-white transition-colors">
            Explore Galaxies
          </Link>
        </div>
      </header>

      {/* Center content */}
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-20 text-center flex flex-col items-center justify-center flex-1">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
        >
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Coordinates Not Found</span>
        </div>

        <h1 className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-300 to-slate-700 tracking-tight leading-none mb-4">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Lost in the Cosmos
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed" style={{ fontWeight: 350 }}>
          The celestial coordinates you requested don&apos;t match any known stars or constellations. It may have collapsed into a singularity or never existed.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
          >
            <Home className="w-4 h-4" />
            <span>Return to Orbit</span>
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-300 text-xs font-semibold transition-colors hover:bg-white/[0.08]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Telescope className="w-4 h-4" />
            <span>Explore Galaxies</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-slate-600">
        CommitCosmos · Navigating developer universes
      </footer>
    </div>
  );
}
