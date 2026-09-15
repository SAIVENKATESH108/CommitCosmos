import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { checkWebhookRateLimit } from '@/lib/ratelimit';
import { getUserByUsername, getUserByGithubId } from '@/db/repositories/userRepository';
import { createProject } from '@/db/repositories/projectRepository';
import { insertCommit } from '@/db/repositories/commitRepository';

// Route segment configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 5 MB max payload size limit to prevent memory exhaustion attacks
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

// Zod schema for GitHub push events
const GitHubPushEventSchema = z.object({
  repository: z.object({
    name: z.string().min(1),
    full_name: z.string().min(1),
    html_url: z.string().url().optional(),
    owner: z.object({
      id: z.number().optional(),
      login: z.string().min(1),
    }),
  }),
  commits: z.array(
    z.object({
      id: z.string().min(1), // sha hash
      message: z.string().nullable().optional(),
      timestamp: z.string().min(1),
    })
  ),
  pusher: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  sender: z
    .object({
      id: z.number(),
      login: z.string(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  // ============================================================================
  // Step 1: Rate Limiting (First Check)
  // ============================================================================
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  const rateLimitResult = await checkWebhookRateLimit(clientIp);
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

  // ============================================================================
  // Step 2: Request Size Verification
  // ============================================================================
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return NextResponse.json(
      { error: 'Payload Too Large' },
      { status: 413 }
    );
  }

  // ============================================================================
  // Step 3: Raw Body Reading & HMAC-SHA256 Signature Verification
  // ============================================================================
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_SIZE) {
    return NextResponse.json(
      { error: 'Payload Too Large' },
      { status: 413 }
    );
  }

  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret unconfigured on server' },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get('x-hub-signature-256');
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    console.warn('[GitHub Webhook] Missing or malformed X-Hub-Signature-256 header');
    return NextResponse.json(
      { error: 'Unauthorized: Missing signature' },
      { status: 401 }
    );
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody, 'utf8')
    .digest('hex')}`;

  const signatureBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    console.warn('[GitHub Webhook] Signature verification failed');
    return NextResponse.json(
      { error: 'Unauthorized: Invalid signature' },
      { status: 401 }
    );
  }

  // ============================================================================
  // Step 4: Parse & Validate JSON Payload
  // ============================================================================
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const parseResult = GitHubPushEventSchema.safeParse(jsonPayload);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Schema validation failed',
        details: parseResult.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  // ============================================================================
  // Step 5: Resolve User & Project
  // ============================================================================
  // Match user from repository owner or sender ID/username
  let user = null;

  if (data.repository.owner.id) {
    user = await getUserByGithubId(data.repository.owner.id);
  }

  if (!user) {
    user = await getUserByUsername(data.repository.owner.login);
  }

  if (!user && data.sender?.id) {
    user = await getUserByGithubId(data.sender.id);
  }

  if (!user) {
    // Acknowledge the delivery so GitHub doesn't retry indefinitely
    return NextResponse.json(
      {
        success: false,
        message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos. No commits ingested.`,
      },
      { status: 200 }
    );
  }

  // Idempotently create or retrieve the project
  const repoUrl =
    data.repository.html_url ||
    `https://github.com/${data.repository.full_name}`;

  const project = await createProject(
    user.id,
    repoUrl,
    data.repository.name
  );

  // ============================================================================
  // Step 6: Ingest Commits Idempotently
  // ============================================================================
  let newlyInserted = 0;
  let skippedDuplicates = 0;

  for (const commit of data.commits) {
    const committedAtDate = new Date(commit.timestamp);
    const result = await insertCommit(
      project.id,
      commit.id,
      commit.message || null,
      null,
      committedAtDate
    );

    if (result) {
      newlyInserted += 1;
    } else {
      skippedDuplicates += 1;
    }
  }

  // ============================================================================
  // Step 7: Return Summary Response
  // ============================================================================
  return NextResponse.json({
    success: true,
    repository: data.repository.full_name,
    userId: user.id,
    projectId: project.id,
    inserted: newlyInserted,
    skipped: skippedDuplicates,
    total: data.commits.length,
  });
}
