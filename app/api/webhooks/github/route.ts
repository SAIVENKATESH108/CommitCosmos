import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { checkWebhookRateLimit } from '@/lib/ratelimit';
import { getUserByUsername, getUserByGithubId } from '@/db/repositories/userRepository';
import { createProject } from '@/db/repositories/projectRepository';
import { insertCommit, markCommitAsPrMerge } from '@/db/repositories/commitRepository';
import { createOrGetBranch, markBranchMerged } from '@/db/repositories/branchRepository';
import { unlockRelease } from '@/db/repositories/releaseRepository';
import { recordClosedIssue } from '@/db/repositories/issueRepository';

// Route segment configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 5 MB max payload size limit to prevent memory exhaustion attacks
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

const RepositorySchema = z.object({
  name: z.string().min(1),
  full_name: z.string().min(1),
  html_url: z.string().url().optional(),
  default_branch: z.string().optional(),
  owner: z.object({
    id: z.number().optional(),
    login: z.string().min(1),
  }),
});

const SenderSchema = z
  .object({
    id: z.number().optional(),
    login: z.string().optional(),
  })
  .optional();

// Zod schema for GitHub push events
const GitHubPushEventSchema = z.object({
  ref: z.string().optional(),
  repository: RepositorySchema,
  commits: z.array(
    z.object({
      id: z.string().min(1), // sha hash
      message: z.string().nullable().optional(),
      timestamp: z.string().min(1),
      added: z.array(z.string()).optional(),
      removed: z.array(z.string()).optional(),
      modified: z.array(z.string()).optional(),
      author: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
          username: z.string().optional(),
        })
        .optional(),
      committer: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
          username: z.string().optional(),
        })
        .optional(),
    })
  ),
  pusher: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  sender: SenderSchema,
});

// Zod schema for GitHub create events (new branch or tag)
const GitHubCreateEventSchema = z.object({
  ref_type: z.string(),
  ref: z.string(),
  repository: RepositorySchema,
  sender: SenderSchema,
});

// Zod schema for GitHub delete events (branch or tag deletion)
const GitHubDeleteEventSchema = z.object({
  ref_type: z.string(),
  ref: z.string(),
  repository: RepositorySchema,
  sender: SenderSchema,
});

// Zod schema for GitHub release events (milestone releases)
const GitHubReleaseEventSchema = z.object({
  action: z.string(),
  release: z.object({
    id: z.number().optional(),
    tag_name: z.string().min(1),
    name: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    draft: z.boolean().optional(),
    prerelease: z.boolean().optional(),
  }),
  repository: RepositorySchema,
  sender: SenderSchema,
});

// Zod schema for GitHub pull_request events (collaborative PR merges)
const GitHubPullRequestEventSchema = z.object({
  action: z.string(),
  number: z.number().optional(),
  pull_request: z.object({
    number: z.number(),
    title: z.string().optional(),
    merged: z.boolean().optional(),
    merge_commit_sha: z.string().nullable().optional(),
    merged_at: z.string().nullable().optional(),
    head: z
      .object({
        ref: z.string().optional(),
      })
      .optional(),
    base: z
      .object({
        ref: z.string().optional(),
      })
      .optional(),
  }),
  repository: RepositorySchema,
  sender: SenderSchema,
});

// Zod schema for GitHub issues events (transient celebratory shooting star)
const GitHubIssuesEventSchema = z.object({
  action: z.string(),
  issue: z.object({
    id: z.number().optional(),
    number: z.number(),
    title: z.string().nullable().optional(),
    state: z.string().optional(),
    state_reason: z.string().nullable().optional(),
    closed_at: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
  }),
  repository: RepositorySchema,
  sender: SenderSchema,
});

async function resolveUser(
  owner: { id?: number; login: string },
  sender?: { id?: number; login?: string }
) {
  let user = null;
  if (owner.id) {
    user = await getUserByGithubId(owner.id);
  }
  if (!user) {
    user = await getUserByUsername(owner.login);
  }
  if (!user && sender?.id) {
    user = await getUserByGithubId(sender.id);
  }
  return user;
}

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
  // Step 4: Parse JSON Payload & Dispatch Event Type
  // ============================================================================
  const githubEvent = request.headers.get('x-github-event') || 'push';

  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  // Handle ping event
  if (githubEvent === 'ping') {
    return NextResponse.json({ success: true, message: 'Pong! Webhook connected successfully.' });
  }

  // ============================================================================
  // Case A: CREATE EVENT (New Branch Created)
  // ============================================================================
  if (githubEvent === 'create') {
    const parseResult = GitHubCreateEventSchema.safeParse(jsonPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Schema validation failed for create event', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const data = parseResult.data;

    // Only process branch creation, ignore tags
    if (data.ref_type !== 'branch') {
      return NextResponse.json({ success: true, message: `Ignoring create event for ref_type: ${data.ref_type}` });
    }

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
      return NextResponse.json(
        { success: false, message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos.` },
        { status: 200 }
      );
    }

    const repoUrl = data.repository.html_url || `https://github.com/${data.repository.full_name}`;
    const project = await createProject(user.id, repoUrl, data.repository.name);

    const isDefault = data.ref === (data.repository.default_branch || 'main');
    const branch = await createOrGetBranch(project.id, data.ref, isDefault);

    return NextResponse.json({
      success: true,
      event: 'create',
      repository: data.repository.full_name,
      branch: branch.branchName,
      isDefault: branch.isDefault,
    });
  }

  // ============================================================================
  // Case B: DELETE EVENT (Branch Deleted / Merged)
  // ============================================================================
  if (githubEvent === 'delete') {
    const parseResult = GitHubDeleteEventSchema.safeParse(jsonPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Schema validation failed for delete event', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const data = parseResult.data;

    if (data.ref_type !== 'branch') {
      return NextResponse.json({ success: true, message: `Ignoring delete event for ref_type: ${data.ref_type}` });
    }

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
      return NextResponse.json(
        { success: false, message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos.` },
        { status: 200 }
      );
    }

    const repoUrl = data.repository.html_url || `https://github.com/${data.repository.full_name}`;
    const project = await createProject(user.id, repoUrl, data.repository.name);

    const mergedBranch = await markBranchMerged(project.id, data.ref, new Date());

    return NextResponse.json({
      success: true,
      event: 'delete',
      repository: data.repository.full_name,
      branch: data.ref,
      mergedAt: mergedBranch?.mergedAt ?? new Date(),
    });
  }

  // ============================================================================
  // Case C: PUSH EVENT (Commits Pushed to Branch)
  // ============================================================================
  if (githubEvent === 'push') {
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

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
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

    // Parse branch name from ref (e.g. "refs/heads/main" or "refs/heads/feature/awesome")
    let branchId: string | null = null;
    let branchName = 'main';
    if (data.ref && data.ref.startsWith('refs/heads/')) {
      branchName = data.ref.replace(/^refs\/heads\//, '');
    } else if (data.ref) {
      branchName = data.ref;
    }

    const isDefault =
      data.repository.default_branch
        ? branchName === data.repository.default_branch
        : branchName === 'main' || branchName === 'master';

    const branch = await createOrGetBranch(project.id, branchName, isDefault);
    branchId = branch.id;

    // Ingest Commits Idempotently
    let newlyInserted = 0;
    let skippedDuplicates = 0;

    for (const commit of data.commits) {
      const committedAtDate = new Date(commit.timestamp);

      const isMerge = commit.message?.toLowerCase().startsWith('merge') ?? false;
      const fileCount =
        (commit.added?.length ?? 0) +
        (commit.removed?.length ?? 0) +
        (commit.modified?.length ?? 0);

      let magnitude: number;
      if (isMerge) {
        magnitude = 100;
      } else if (fileCount > 0) {
        magnitude = Math.min(150, fileCount * 15);
      } else {
        const msgLen = (commit.message || '').trim().length;
        magnitude = Math.max(15, Math.min(80, Math.floor(msgLen * 0.75)));
      }

      const prMatch = (commit.message || '').match(/merge pull request #(\d+)/i);
      const isPrMerge = Boolean(prMatch) || isMerge;
      const prNumber = prMatch ? parseInt(prMatch[1], 10) : null;

      const authorUsername =
        commit.author?.username ||
        commit.committer?.username ||
        data.sender?.login ||
        commit.author?.name ||
        user.githubUsername;
      const authorAvatarUrl =
        commit.author?.username
          ? `https://github.com/${commit.author.username}.png`
          : data.sender?.login
          ? `https://github.com/${data.sender.login}.png`
          : user.avatarUrl;

      const result = await insertCommit(
        project.id,
        commit.id,
        commit.message || null,
        null,
        committedAtDate,
        magnitude,
        branchId,
        isPrMerge,
        prNumber,
        authorUsername,
        authorAvatarUrl
      );

      if (result) {
        newlyInserted += 1;
      } else {
        skippedDuplicates += 1;
      }
    }

    return NextResponse.json({
      success: true,
      event: 'push',
      repository: data.repository.full_name,
      userId: user.id,
      projectId: project.id,
      branchId,
      branchName,
      inserted: newlyInserted,
      skipped: skippedDuplicates,
      total: data.commits.length,
    });
  }

  // ============================================================================
  // Case D: RELEASE EVENT (Tagged Release Milestone Published)
  // ============================================================================
  if (githubEvent === 'release') {
    const parseResult = GitHubReleaseEventSchema.safeParse(jsonPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Schema validation failed for release event', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Architectural Policy Decision:
    // Only 'published' releases trigger the milestone unlock and supernova event.
    // Drafts and prereleases are intentionally ignored so users only see official,
    // public deployment milestones in their celestial galaxy.
    if (data.action !== 'published' || data.release.draft) {
      return NextResponse.json({
        success: true,
        message: `Ignoring release event with action '${data.action}' (draft=${data.release.draft ?? false})`,
      });
    }

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
      return NextResponse.json(
        { success: false, message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos.` },
        { status: 200 }
      );
    }

    const repoUrl = data.repository.html_url || `https://github.com/${data.repository.full_name}`;
    const project = await createProject(user.id, repoUrl, data.repository.name);

    const releasedAt = data.release.published_at ? new Date(data.release.published_at) : new Date();
    const release = await unlockRelease(
      project.id,
      data.release.tag_name,
      data.release.name || null,
      releasedAt
    );

    return NextResponse.json({
      success: true,
      event: 'release',
      action: data.action,
      repository: data.repository.full_name,
      releaseId: release.id,
      tagName: release.tagName,
      releaseName: release.releaseName,
      releasedAt: release.releasedAt,
    });
  }

  // ============================================================================
  // Case E: PULL REQUEST EVENT (Collaborative PR Merges)
  // ============================================================================
  if (githubEvent === 'pull_request') {
    const parseResult = GitHubPullRequestEventSchema.safeParse(jsonPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Schema validation failed for pull_request event', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Only process closed PRs that were successfully merged
    if (data.action !== 'closed' || !data.pull_request.merged) {
      return NextResponse.json({
        success: true,
        message: `Ignoring pull_request event with action '${data.action}' (merged=${data.pull_request.merged ?? false})`,
      });
    }

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
      return NextResponse.json(
        { success: false, message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos.` },
        { status: 200 }
      );
    }

    const repoUrl = data.repository.html_url || `https://github.com/${data.repository.full_name}`;
    const project = await createProject(user.id, repoUrl, data.repository.name);

    const prNumber = data.pull_request.number;
    const mergeSha = data.pull_request.merge_commit_sha;

    if (mergeSha) {
      // Check if commit already exists; update it or insert it
      const updated = await markCommitAsPrMerge(project.id, mergeSha, prNumber);
      if (!updated) {
        // If not yet ingested via push webhook, insert it now
        const mergedAt = data.pull_request.merged_at ? new Date(data.pull_request.merged_at) : new Date();
        await insertCommit(
          project.id,
          mergeSha,
          `Merge pull request #${prNumber}: ${data.pull_request.title || 'Merged PR'}`,
          null,
          mergedAt,
          100, // Supergiant PR magnitude
          null,
          true,
          prNumber
        );
      }
    }

    return NextResponse.json({
      success: true,
      event: 'pull_request',
      action: data.action,
      repository: data.repository.full_name,
      prNumber,
      mergeCommitSha: mergeSha,
      isPrMerge: true,
    });
  }

  // ============================================================================
  // Case F: ISSUES EVENT (Transient Celebratory Shooting Star on Close)
  // ============================================================================
  if (githubEvent === 'issues') {
    const parseResult = GitHubIssuesEventSchema.safeParse(jsonPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Schema validation failed for issues event', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Only trigger shooting stars on issue closures
    if (data.action !== 'closed') {
      return NextResponse.json({
        success: true,
        message: `Ignoring issues event with action '${data.action}'`,
      });
    }

    const user = await resolveUser(data.repository.owner, data.sender);
    if (!user) {
      return NextResponse.json(
        { success: false, message: `Repository owner @${data.repository.owner.login} is not registered on CommitCosmos.` },
        { status: 200 }
      );
    }

    const repoUrl = data.repository.html_url || `https://github.com/${data.repository.full_name}`;
    const project = await createProject(user.id, repoUrl, data.repository.name);

    // Identify linked commit SHA or PR number from issue body/events if available
    const body = data.issue.body || '';
    const shaMatch = body.match(/\b([0-9a-f]{40})\b/i);
    const closingCommitSha = shaMatch ? shaMatch[1] : null;

    const prMatch = body.match(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|pr)\s+#?(\d+)/i);
    const closingPrNumber = prMatch ? parseInt(prMatch[1], 10) : null;

    const closedAt = data.issue.closed_at ? new Date(data.issue.closed_at) : new Date();

    const issueRecord = await recordClosedIssue(
      project.id,
      data.issue.number,
      data.issue.title || null,
      closingCommitSha,
      closingPrNumber,
      closedAt
    );

    return NextResponse.json({
      success: true,
      event: 'issues',
      action: data.action,
      repository: data.repository.full_name,
      issueId: issueRecord.id,
      issueNumber: issueRecord.issueNumber,
      issueTitle: issueRecord.issueTitle,
      closingCommitSha,
      closingPrNumber,
      closedAt: issueRecord.closedAt,
    });
  }

  // Default fallback for unhandled events
  return NextResponse.json({
    success: true,
    message: `Event '${githubEvent}' received and ignored.`,
  });
}
