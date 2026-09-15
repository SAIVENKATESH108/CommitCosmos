import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkReadRateLimit } from '@/lib/ratelimit';
import { getUserStats } from '@/db/repositories/userRepository';

export const dynamic = 'force-dynamic';

// Validation schema for the username path parameter: 1-39 chars, alphanumeric with single hyphens (GitHub username spec)
const UsernameSchema = z
  .string()
  .min(1, 'Username is required')
  .max(39, 'Username exceeds GitHub max length of 39 characters')
  .regex(
    /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
    'Invalid username format'
  );

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  // 1. Rate Limiting (30 requests / 60 seconds sliding window per IP)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  const rateLimitResult = await checkReadRateLimit(clientIp);
  if (!rateLimitResult.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: 'Too Many Requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  // 2. Validate username path parameter with Zod
  const validation = UsernameSchema.safeParse(params.username);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid username parameter', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const username = validation.data;

  // 3. Retrieve user stats directly from user_stats_view via repository layer
  const stats = await getUserStats(username);
  if (!stats) {
    return NextResponse.json(
      { error: `User stats for '${username}' not found` },
      { status: 404 }
    );
  }

  // 4. Return user stats directly as JSON
  return NextResponse.json(stats);
}
