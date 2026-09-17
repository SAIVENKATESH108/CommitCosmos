import { SignInButton } from '@/components/auth/SignInButton';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Star, Shield, ArrowLeft } from 'lucide-react';

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4" style={{ background: '#02000a' }}>
      {/* Animated nebula glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Star field */}
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 2 + 0.5 + 'px',
              height: Math.random() * 2 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              opacity: Math.random() * 0.5 + 0.1,
            }} />
        ))}
      </div>

      {/* Back link */}
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors z-20">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', boxShadow: '0 40px 80px rgba(109,40,217,0.25)' }}>

        {/* Logo glow */}
        <div className="mx-auto mb-6 relative w-20 h-20">
          <div className="absolute inset-0 rounded-2xl animate-glow-pulse"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)', filter: 'blur(15px)' }} />
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #0e7490)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
            <Image src="/commitcosmos_logo.png" alt="CommitCosmos" width={80} height={80} className="w-full h-full object-cover" priority />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Enter the <span className="text-gradient-cosmic">Cosmos</span>
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-8" style={{ fontWeight: 350 }}>
          Connect your GitHub account to transform your commit history into an interactive 3D galaxy.
        </p>

        <SignInButton className="w-full justify-center py-3.5 text-sm font-bold rounded-2xl" />

        {/* Trust badges */}
        <div className="mt-6 flex flex-col gap-2.5">
          {[
            { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, text: 'Read-only OAuth permissions' },
            { icon: <Star className="w-3.5 h-3.5 text-violet-400" />, text: 'Zero repository write access' },
            { icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, text: 'Your data is never shared' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
