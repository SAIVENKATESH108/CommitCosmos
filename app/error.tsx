'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error monitoring service
    console.error('Cosmic Anomaly detected in client render:', error);
  }, [error]);

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden" style={{ background: '#02000a' }}>
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.14) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }}
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
          <button
            onClick={() => reset()}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </header>

      {/* Center content */}
      <main className="relative z-10 mx-auto max-w-xl px-4 py-16 text-center flex flex-col items-center justify-center flex-1">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Cosmic Anomaly Detected</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Gravitational Distortion
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed" style={{ fontWeight: 350 }}>
          An unexpected interruption disturbed the telemetry feed. This can happen during solar flares or transient network fluctuations.
        </p>

        {error.digest && (
          <div className="mb-8 px-4 py-2 rounded-lg text-[11px] font-mono text-slate-500" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Error Reference: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 18px rgba(124,58,237,0.35)' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recalibrate & Retry</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-300 text-xs font-semibold transition-colors hover:bg-white/[0.08]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Home className="w-4 h-4" />
            <span>Return to Orbit</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-slate-600">
        CommitCosmos Telemetry System
      </footer>
    </div>
  );
}
