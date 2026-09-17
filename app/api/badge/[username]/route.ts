import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/db/repositories/userRepository';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username;
  if (!username) {
    return new NextResponse('Username required', { status: 400 });
  }

  let stats = null;
  try {
    stats = await getUserStats(username);
  } catch (err) {
    console.error('Error fetching user stats for badge:', err);
  }

  const streak = stats?.currentStreak ?? 0;
  const stars = stats?.totalCommits ?? 0;
  const safeUsername = escapeXml(username);

  const streakText = `${streak}d streak`;
  const starsText = `${stars} stars`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="36" viewBox="0 0 310 36" fill="none" role="img" aria-label="CommitCosmos: @${safeUsername} - ${streakText}, ${starsText}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="310" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#090014" />
      <stop offset="50%" stop-color="#02000a" />
      <stop offset="100%" stop-color="#04091e" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0" y1="0" x2="310" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#6366f1" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.7" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>

  <!-- Background Pill -->
  <rect x="0.5" y="0.5" width="309" height="35" rx="17.5" fill="url(#bgGrad)" stroke="url(#borderGrad)" />

  <!-- Logo Mark (Cosmic Star & Ring) -->
  <g transform="translate(14, 10)">
    <circle cx="8" cy="8" r="6.5" fill="#8b5cf6" fill-opacity="0.25" />
    <circle cx="8" cy="8" r="3" fill="#c084fc" />
    <path d="M8 0L9.5 5.5L15 8L9.5 10.5L8 16L6.5 10.5L1 8L6.5 5.5Z" fill="url(#accentGrad)" />
  </g>

  <!-- Brand Text -->
  <text x="38" y="22" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.2">
    CommitCosmos
  </text>

  <!-- Divider 1 -->
  <circle cx="128" cy="18" r="1.5" fill="#ffffff" fill-opacity="0.3" />

  <!-- Streak Section -->
  <g transform="translate(138, 10)">
    <!-- Flame icon -->
    <path d="M4.5 1.5C4.5 1.5 5.5 3 5.5 4.5C5.5 5.5 5 6 4.5 6.5C4 7 3.5 7.5 3.5 9C3.5 11 5 13 8 13C10.5 13 12 11 12 8.5C12 5.5 9.5 3.5 9.5 3.5C9.5 3.5 9.5 5 8.5 5.5C7.5 6 7 5.5 7 4.5C7 3 5.5 1.5 4.5 1.5Z" fill="#f97316" transform="scale(0.85) translate(-1, 0)" />
  </g>
  <text x="156" y="22" fill="#f97316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">
    ${streakText}
  </text>

  <!-- Divider 2 -->
  <circle cx="218" cy="18" r="1.5" fill="#ffffff" fill-opacity="0.3" />

  <!-- Stars Section -->
  <g transform="translate(228, 10)">
    <!-- Star icon -->
    <path d="M7 1L8.8 4.7L13 5.3L10 8.2L10.7 12.4L7 10.4L3.3 12.4L4 8.2L1 5.3L5.2 4.7L7 1Z" fill="#fbbf24" transform="scale(0.85) translate(-1, 0)" />
  </g>
  <text x="246" y="22" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">
    ${starsText}
  </text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
