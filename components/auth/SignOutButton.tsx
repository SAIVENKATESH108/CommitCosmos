'use client';

import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/authActions';
import { LogOut } from 'lucide-react';

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className={`inline-flex items-center gap-1.5 border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200 ${className || ''}`}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Sign Out</span>
      </Button>
    </form>
  );
}
