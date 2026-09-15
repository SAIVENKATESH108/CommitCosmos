import { auth } from '@/lib/auth';
import { SignInButton } from '@/components/auth/SignInButton';
import { SignOutButton } from '@/components/auth/SignOutButton';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Subtle cosmic background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
          First Commit &bull; Devpost
        </div>

        <h1 className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-7xl">
          CommitCosmos
        </h1>

        <p className="max-w-md text-sm text-slate-400 sm:text-base">
          Transform your GitHub commit history into an interactive 3D galaxy: every
          commit lights a star, every streak weaves a constellation.
        </p>

        {/* Authentication State Card */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {session?.user ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.githubUsername || 'Avatar'}
                    width={36}
                    height={36}
                    className="rounded-full border border-cyan-500/40"
                  />
                )}
                <div className="text-left">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white">
                    @{session.user.githubUsername || session.user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  <span>Open Observatory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <SignOutButton />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <SignInButton />
              <span className="text-[11px] text-slate-500">
                Minimum read-only permissions requested
              </span>
            </div>
          )}
        </div>

        {/* Tech Stack Badges */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-2 text-xs text-slate-500">
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono">
            NextAuth v5 Beta
          </span>
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono">
            GitHub OAuth
          </span>
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono">
            Neon Postgres
          </span>
          <span className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono">
            Drizzle ORM
          </span>
        </div>
      </div>
    </main>
  );
}
