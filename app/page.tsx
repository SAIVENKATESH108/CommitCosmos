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
  Star,
  Zap,
  ChevronRight,
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col" style={{ background: '#02000a' }}>
      {/* ── Ambient nebula background ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Primary violet nebula */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Cyan accent */}
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '1.5s' }} />
        {/* Deep blue */}
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,7,100,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Star field dots */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: (Math.random() * 4) + 's',
              opacity: Math.random() * 0.6 + 0.1,
            }} />
        ))}
      </div>

      {/* ── Top Navbar ── */}
      <header className="relative z-30 border-b border-white/[0.06]" style={{ background: 'rgba(2,0,10,0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4c1d95, #0e7490)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
              <Image src="/commitcosmos_logo.png" alt="CommitCosmos Logo" width={36} height={36}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" priority />
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg leading-none">
              Commit<span className="text-gradient-cosmic">Cosmos</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/u/galaxy-explorer" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">Demo Galaxy</Link>
            <a href="https://github.com/SAIVENKATESH108/CommitCosmos" target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors">GitHub</a>
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <Link href={`/u/${session.user.githubUsername || 'cosmonaut'}`}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  My Galaxy
                </Link>
                <Link href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl text-white font-semibold text-xs px-4 py-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                  <span>Observatory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <SignOutButton />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/u/galaxy-explorer"
                  className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors">
                  Explore Demo
                </Link>
                <SignInButton />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-32 pb-16 text-center flex flex-col items-center">

          {/* Hackathon badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
            style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>First Commit Hackathon · Devpost 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white max-w-4xl leading-[1.0] mb-6">
            Your commits,<br />
            <span className="text-gradient-cosmic">a living galaxy</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10" style={{ fontWeight: 350 }}>
            Every Git push illuminates a glowing star. Every daily commit streak weaves an ancient constellation.
            Explore your engineering legacy in an interactive Three.js universe.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            {session?.user ? (
              <>
                <Link href={`/u/${session.user.githubUsername || 'cosmonaut'}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-100"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 8px 40px rgba(124,58,237,0.45)' }}>
                  <Star className="w-4 h-4 fill-white" />
                  <span>View Your 3D Galaxy</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm text-slate-200 transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span>Observatory</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="w-full rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(124,58,237,0.45)' }}>
                  <SignInButton className="w-full justify-center py-3.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 border-0 text-white rounded-2xl" />
                </div>
                <p className="text-[11px] text-slate-500">
                  🔒 Read-only OAuth · Zero write access to your repos
                </p>
              </div>
            )}
          </div>

          {/* Hero banner image */}
          <div className="mt-16 w-full max-w-5xl relative group">
            <div className="absolute -inset-1 rounded-3xl opacity-40 group-hover:opacity-70 transition duration-1000 blur-xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4, #7c3aed)', backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }} />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl animate-levitate"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
              <Image src="/commitcosmos_banner.png" alt="CommitCosmos 3D Galaxy Visualization"
                width={1200} height={630} className="w-full h-auto object-cover" priority />
              {/* Overlay shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))' }} />
            </div>
          </div>
        </section>

        {/* ── Stats Banner ── */}
        <section className="relative z-10 py-8 border-y border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '∞', label: 'Stars per commit', icon: <Star className="w-4 h-4" /> },
              { value: '3D', label: 'WebGL galaxy view', icon: <Globe2 className="w-4 h-4" /> },
              { value: '0s', label: 'Webhook latency', icon: <Zap className="w-4 h-4" /> },
            ].map(({ value, label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-violet-400">{icon}
                  <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">{value}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Pillars ── */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              How the <span className="text-gradient-cosmic">cosmos</span> works
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Three powerful primitives that transform raw Git history into a living universe.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <GitCommit className="w-6 h-6" />,
                color: '#f59e0b',
                glow: 'rgba(245,158,11,0.3)',
                bg: 'rgba(245,158,11,0.08)',
                border: 'rgba(245,158,11,0.2)',
                title: 'Commits Ignite Stars',
                desc: 'Real-time GitHub push webhooks ingest commits within seconds. Each star inherits a spectral color from the programming language used.',
              },
              {
                icon: <Flame className="w-6 h-6" />,
                color: '#f97316',
                glow: 'rgba(249,115,22,0.3)',
                bg: 'rgba(249,115,22,0.08)',
                border: 'rgba(249,115,22,0.2)',
                title: 'Streaks Forge Constellations',
                desc: 'Consecutive daily commit activity weaves star connectors. Hit a 7-day streak to unlock a mythic named constellation in your galaxy.',
              },
              {
                icon: <Globe2 className="w-6 h-6" />,
                color: '#8b5cf6',
                glow: 'rgba(139,92,246,0.3)',
                bg: 'rgba(139,92,246,0.08)',
                border: 'rgba(139,92,246,0.2)',
                title: 'Dual 3D & 2D Views',
                desc: 'Full WCAG AA parity. Users with motion sensitivity or screen readers toggle seamlessly from WebGL orbit controls to a semantic tabular report.',
              },
            ].map(({ icon, color, glow, bg, border, title, desc }) => (
              <div key={title}
                className="group p-6 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, backdropFilter: 'blur(20px)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${glow}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: bg, border: `1px solid ${border}`, color, boxShadow: `0 0 20px ${glow}` }}>
                  {icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Architecture Section ── */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pb-20">
          <div className="rounded-3xl p-8 sm:p-12"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Under the Hood</h2>
                <p className="text-sm text-slate-400">Production-grade architecture, no shortcuts.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['TypeScript Strict', 'Neon Postgres', 'React Three Fiber'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold"
                    style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: <Layers className="w-5 h-5 text-violet-400" />, title: 'Repository Pattern', desc: 'Zero raw SQL in API routes. All Drizzle ORM queries are 100% encapsulated in typed repositories.' },
                { icon: <Terminal className="w-5 h-5 text-cyan-400" />, title: 'Fibonacci Sphere', desc: 'Golden-angle spiral algorithm positions stars with isotropic, clump-free spacing across the galaxy.' },
                { icon: <Lock className="w-5 h-5 text-emerald-400" />, title: 'Defense-in-Depth', desc: 'HMAC-SHA256 webhooks, Upstash sliding-window rate limits, and non-wildcard Content Security Policy.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8" style={{ background: 'rgba(2,0,10,0.8)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg overflow-hidden" style={{ boxShadow: '0 0 10px rgba(139,92,246,0.4)' }}>
              <Image src="/commitcosmos_logo.png" alt="" width={24} height={24} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-slate-500">© 2026 CommitCosmos · Built for First Commit Hackathon</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Demo Galaxy', href: '/u/galaxy-explorer' },
              { label: 'GitHub', href: 'https://github.com/SAIVENKATESH108/CommitCosmos' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-200 transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
