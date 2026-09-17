'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Terminal, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProtostarOverlayProps {
  username: string;
  repoName?: string | null;
}

export function ProtostarOverlay({ username, repoName }: ProtostarOverlayProps) {
  return (
    <aside
      aria-label="Protostar Empty State Notification"
      className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-md w-full rounded-2xl border border-indigo-500/30 bg-black/85 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 text-center space-y-4">
        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1 bg-indigo-950/60 text-indigo-300 border-indigo-500/40 text-xs font-semibold shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping mr-1.5 inline-block" />
            Protostar Core Detected
          </Badge>
        </div>

        {/* Primary Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your galaxy is waiting for its first star
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            {repoName ? (
              <>
                Repository <span className="font-semibold text-indigo-300">{repoName}</span> has no recorded commits yet.
              </>
            ) : (
              <>
                Push a commit to begin your cosmic journey for <span className="font-semibold text-indigo-300">@{username}</span>.
              </>
            )}
          </p>
          <p className="text-xs text-slate-400">
            Every Git commit illuminates a star classified by programming language, lines touched, and velocity.
          </p>
        </div>

        {/* Helpful Quick Command Hint */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-left font-mono text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-300 truncate">git commit -m &quot;feat: ignite first star&quot;</span>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0">git push</span>
        </div>

        {/* Action Link */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/30 transition-colors"
          >
            <span>Observatory Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explore Galaxy</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
export default ProtostarOverlay;
