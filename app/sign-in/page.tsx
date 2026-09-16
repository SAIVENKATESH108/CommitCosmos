import { SignInButton } from '@/components/auth/SignInButton';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center bg-black">
      {/* Background glow effects — very subtle so they don't compete with black void */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[400px] w-[400px] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="h-[300px] w-[300px] rounded-full bg-indigo-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/60 backdrop-blur-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Enter the Cosmos
        </h1>
        <p className="mt-2 text-xs text-slate-300">
          Connect your GitHub account to transform your commit history into an
          interactive 3D galaxy.
        </p>

        <div className="mt-6 flex justify-center">
          <SignInButton className="w-full justify-center" />
        </div>

        <p className="mt-6 text-[11px] text-slate-400">
          We request read-only access to public repos and webhook management. We
          never request full write access.
        </p>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
