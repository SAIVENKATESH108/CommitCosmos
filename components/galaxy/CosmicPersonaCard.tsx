'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Share2, Compass, Orbit, Zap, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { GalaxyCommit, GalaxyProject } from '@/lib/queries';

interface CosmicPersonaCardProps {
  username: string;
  commits: GalaxyCommit[];
  projects: GalaxyProject[];
  streak: number;
}

interface Archetype {
  name: string;
  badge: string;
  spectralClass: string;
  description: string;
  colorClass: string;
  borderColor: string;
  glowColor: string;
}

/**
 * Calculates a cosmic developer archetype based on real commit timestamp distributions
 */
function deriveArchetype(commits: GalaxyCommit[], streak: number): Archetype {
  if (commits.length === 0) {
    return {
      name: 'Unignited Protostar',
      badge: 'Dust Nebula',
      spectralClass: 'Class T (Pre-Ignition)',
      description: 'Cosmic matter gathering in gravitational orbit, awaiting its first thermonuclear commit.',
      colorClass: 'text-slate-400',
      borderColor: 'border-slate-700/50',
      glowColor: 'rgba(148, 163, 184, 0.2)',
    };
  }

  // Analyze commit hours
  const hours = commits.map((c) => new Date(c.committedAt).getUTCHours());
  const nightCount = hours.filter((h) => h >= 22 || h < 5).length;
  const morningCount = hours.filter((h) => h >= 5 && h < 12).length;
  const afternoonCount = hours.filter((h) => h >= 12 && h < 18).length;
  const eveningCount = hours.filter((h) => h >= 18 && h < 22).length;

  const maxCount = Math.max(nightCount, morningCount, afternoonCount, eveningCount);

  if (nightCount === maxCount) {
    return {
      name: 'Midnight Pulsar',
      badge: 'Nocturnal Emitter',
      spectralClass: streak >= 5 ? 'Class O (Ultra-Dense)' : 'Class B (High-Spin)',
      description: 'Radiates intense gravitational bursts while the hemisphere sleeps. Peak commit velocity under darkness.',
      colorClass: 'text-violet-400',
      borderColor: 'border-violet-500/40',
      glowColor: 'rgba(139, 92, 246, 0.25)',
    };
  }

  if (morningCount === maxCount) {
    return {
      name: 'Dawn Protostar',
      badge: 'Solar Vanguard',
      spectralClass: 'Class A (Rapid Ignition)',
      description: 'Breaks the horizon before dawn, channeling first-light mental clarity into clean architectural commits.',
      colorClass: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      glowColor: 'rgba(245, 158, 11, 0.25)',
    };
  }

  if (eveningCount === maxCount) {
    return {
      name: 'Twilight Supernova',
      badge: 'Dusk Titan',
      spectralClass: 'Class F (Deep Horizon)',
      description: 'Weaves cosmic threads as daylight recedes. Reaches catastrophic creative momentum during golden hour.',
      colorClass: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      glowColor: 'rgba(244, 63, 94, 0.25)',
    };
  }

  return {
    name: 'Solar Dynamo',
    badge: 'Daylight Core',
    spectralClass: 'Class G (Thermonuclear)',
    description: 'Steadfast, unstoppable diurnal momentum. Powers sprawling repository galaxies with relentless execution.',
    colorClass: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(6, 182, 212, 0.25)',
  };
}

export function CosmicPersonaCard({
  username,
  commits,
  projects,
  streak,
}: CosmicPersonaCardProps) {
  const [copied, setCopied] = useState(false);

  const archetype = useMemo(() => deriveArchetype(commits, streak), [commits, streak]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://commitcosmos.vercel.app/u/${username}`;
    const shareText = `My GitHub Cosmic Persona is ✦ ${archetype.name} (${commits.length} Stars, ${streak}d streak) on @commitcosmos! 🌌\n\nExplore my interactive 3D universe: ${url}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        toast.success('Cosmic Persona copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  return (
    <Card
      className="bg-slate-950/85 border-slate-800/80 backdrop-blur-md shadow-2xl text-slate-200 overflow-hidden"
      style={{
        boxShadow: `0 0 25px ${archetype.glowColor}`,
      }}
    >
      <CardHeader className="p-4 pb-2 border-b border-slate-800/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-violet-400" aria-hidden="true" />
          <span>Cosmic Persona</span>
        </CardTitle>
        <Badge
          variant="outline"
          className={`text-[10px] font-mono uppercase tracking-wider ${archetype.borderColor} ${archetype.colorClass}`}
        >
          {archetype.badge}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-3">
        {/* Archetype Title & Class */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-black tracking-tight ${archetype.colorClass}`}>
              {archetype.name}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {archetype.spectralClass}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            {archetype.description}
          </p>
        </div>

        {/* Astrophysical Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/50 text-center font-mono">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              Luminosity
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{commits.length} ★</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800/60">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Orbit className="w-2.5 h-2.5 text-indigo-400" />
              Gravity
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{projects.length} Clust</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Compass className="w-2.5 h-2.5 text-cyan-400" />
              Resonance
            </span>
            <span className="text-xs font-bold text-white mt-0.5">{streak}d Flux</span>
          </div>
        </div>

        {/* 1-Click Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/30 hover:border-violet-400/50 text-violet-200 hover:text-white text-xs font-medium transition-all duration-150 active:scale-98"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Share Cosmic Persona</span>
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
