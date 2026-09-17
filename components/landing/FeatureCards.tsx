'use client';

import { GitCommit, Flame, Globe2 } from 'lucide-react';

const features = [
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
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {features.map(({ icon, color, glow, bg, border, title, desc }) => (
        <div
          key={title}
          className="group p-6 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 cursor-default"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid rgba(255,255,255,0.08)`,
            backdropFilter: 'blur(20px)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = border;
            el.style.boxShadow = `0 20px 60px ${glow}`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = 'rgba(255,255,255,0.08)';
            el.style.boxShadow = '';
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: bg, border: `1px solid ${border}`, color, boxShadow: `0 0 20px ${glow}` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
