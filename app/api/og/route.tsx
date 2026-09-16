import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const OGParamsSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(39)
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/)
    .catch('cosmonaut'),
  totalCommits: z.coerce.number().int().min(0).max(1000000).catch(0),
  currentStreak: z.coerce.number().int().min(0).max(10000).catch(0),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = OGParamsSchema.parse({
    username: searchParams.get('username') || 'cosmonaut',
    totalCommits: searchParams.get('totalCommits') || '0',
    currentStreak: searchParams.get('currentStreak') || '0',
  });

  const username = parsed.username;
  const totalCommits = String(parsed.totalCommits);
  const currentStreak = String(parsed.currentStreak);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.08) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(99, 102, 241, 0.12) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          color: '#f1f5f9',
          padding: '60px 80px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '420px',
            height: '420px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.25)',
            filter: 'blur(100px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '100px',
            width: '380px',
            height: '380px',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.2)',
            filter: 'blur(90px)',
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                CommitCosmos
              </span>
              <span
                style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }}
              >
                Interactive 3D GitHub Galaxy
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontSize: '15px',
              fontWeight: '600',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a5b4fc">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span>Stellar Registry</span>
          </div>
        </div>

        {/* Center: Constellation & User Identity */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '20px 0',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: '18px',
                color: '#818cf8',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: '700',
              }}
            >
              Cosmic Profile
            </span>
            <span
              style={{
                fontSize: '64px',
                fontWeight: '900',
                letterSpacing: '-2px',
                color: '#ffffff',
                textShadow: '0 4px 30px rgba(99, 102, 241, 0.4)',
              }}
            >
              @{username}&apos;s Galaxy
            </span>
            <span
              style={{
                fontSize: '20px',
                color: '#94a3b8',
                maxWidth: '650px',
                lineHeight: 1.4,
              }}
            >
              Every commit lights a star. Every continuous streak weaves a celestial constellation.
            </span>
          </div>

          {/* Stylized Constellation SVG graphic */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '220px',
              height: '220px',
              position: 'relative',
            }}
          >
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
              {/* Constellation Connection Lines */}
              <line x1="30" y1="120" x2="80" y2="40" stroke="#818cf8" strokeWidth="2.5" opacity="0.7" />
              <line x1="80" y1="40" x2="160" y2="60" stroke="#38bdf8" strokeWidth="2.5" opacity="0.8" />
              <line x1="160" y1="60" x2="170" y2="150" stroke="#818cf8" strokeWidth="2.5" opacity="0.7" />
              <line x1="80" y1="40" x2="110" y2="130" stroke="#c084fc" strokeWidth="2" opacity="0.6" strokeDasharray="4 4" />
              <line x1="110" y1="130" x2="170" y2="150" stroke="#38bdf8" strokeWidth="2.5" opacity="0.7" />

              {/* Star Nodes */}
              <circle cx="30" cy="120" r="7" fill="#38bdf8" />
              <circle cx="80" cy="40" r="9" fill="#818cf8" />
              <circle cx="160" cy="60" r="8" fill="#facc15" />
              <circle cx="110" cy="130" r="6" fill="#c084fc" />
              <circle cx="170" cy="150" r="9" fill="#38bdf8" />
            </svg>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
          }}
        >
          {/* Total Stars Metric */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 32px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '220px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Stars Ignited
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: '900', color: '#38bdf8' }}>
                {totalCommits}
              </span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>commits</span>
            </div>
          </div>

          {/* Daily Streak Metric */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 32px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '220px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#94a3b8',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Current Streak
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: '900', color: '#fb923c' }}>
                {currentStreak}
              </span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>days</span>
            </div>
          </div>

          {/* Cosmos Status Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '18px 32px',
              borderRadius: '20px',
              background: 'rgba(30, 27, 75, 0.6)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#a5b4fc">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: '600' }}>
                Live Stellar Stream
              </span>
            </div>
            <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: '700', marginTop: '4px' }}>
              commitcosmos.vercel.app/u/{username}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
