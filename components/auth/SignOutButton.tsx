'use client';

import { signOutAction } from '@/lib/actions/authActions';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <form action={signOutAction} className="inline-flex">
      <button
        type="submit"
        aria-label="Sign out of CommitCosmos"
        className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-200 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 cursor-pointer ${className || ''}`}
        style={{
          background: 'rgba(255, 255, 255, 0.035)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.28)';
          e.currentTarget.style.boxShadow = '0 0 16px rgba(244, 63, 94, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        <span className="font-medium tracking-tight">Sign Out</span>
      </button>
    </form>
  );
}
