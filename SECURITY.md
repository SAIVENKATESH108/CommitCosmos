# Security Architecture & Protections

CommitCosmos implements a layered security defense model. This document outlines our application-level protections, data boundaries, and hosting security model for hackathon judging and security auditing.

---

## 1. Custom Application-Level Protections (Built by Us)

### A. Defensive Webhook Pipeline (`/app/api/webhooks/github`)
- **Rate Limiter First**: The rate limiter runs as the very first line of defense before reading the body, allocating buffers, or executing cryptographic operations. Prevents volumetric compute attacks.
- **Payload Size Capping**: Inbound payloads are strictly capped at 5 MB (`MAX_PAYLOAD_SIZE`). Over-sized requests receive `413 Payload Too Large` immediately to protect against server memory exhaustion.
- **HMAC-SHA256 Cryptographic Verification**: Inbound GitHub webhooks require a valid `X-Hub-Signature-256` header signed with the shared webhook secret. Verified using `crypto.timingSafeEqual` over raw UTF-8 request bytes to eliminate timing side-channel attacks.
- **Strict Zod Schema Validation**: All JSON payloads are validated via Zod schemas before being passed to downstream services. Malformed, untyped, or extra parameters are rejected with `400 Bad Request`.
- **Database Idempotency**: Natural unique composite constraints on `(project_id, sha)` prevent duplicate star creations even if GitHub redelivers events.

### B. Global Security Headers & Strict Content Security Policy (`next.config.mjs`)
- **`X-Frame-Options: DENY`**: Prevents clickjacking by completely disallowing CommitCosmos from being embedded in iframes on third-party sites.
- **`X-Content-Type-Options: nosniff`**: Enforces strict MIME typing to block MIME-confusion attacks.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Ensures sensitive query paths or referrer strings are never leaked to external origins.
- **`Content-Security-Policy (CSP)`**: Strict non-wildcard policy. Only allows `'self'` for scripts, styles, and fonts, and restricts image loading to `'self'`, `blob:`, `data:`, and `https://avatars.githubusercontent.com`. Embeds and forms are locked to `'self'` and `https://github.com`.
- **`Permissions-Policy`**: Disables access to camera, microphone, and geolocation hardware APIs.

### C. Strict Repository Isolation Layer (`/db/repositories/*`)
- **Zero Raw Queries in API Routes**: API routes and server components never execute raw SQL or un-parameterized queries.
- All database access routes through single-purpose functions in `userRepository`, `projectRepository`, `commitRepository`, `streakRepository`, and `constellationRepository`.
- Every database interaction uses Drizzle ORM's parameterized query builder, making SQL injection impossible by construction.

### D. Zero Exposure of Secrets to Client Components
- All sensitive environment variables (`DATABASE_URL`, `GITHUB_WEBHOOK_SECRET`, `AUTH_SECRET`, `GITHUB_SECRET`, `UPSTASH_REDIS_REST_TOKEN`) are strictly accessible on the server side only.
- Client bundles never reference `process.env` secrets; only the public, non-sensitive `NEXT_PUBLIC_APP_URL` is exposed for canonical URL resolution.

### E. Authenticated Session Cookie Hardening (`/lib/auth.ts`)
- NextAuth v5 session tokens are configured with `httpOnly: true`, preventing access from client-side JavaScript (mitigating XSS session theft).
- Set to `sameSite: 'lax'` to prevent cross-site request forgery (CSRF).
- Configured with `secure: true` in production environments (`__Secure-authjs.session-token`).
- OAuth requests request the minimum necessary read-only permissions (`read:user user:email public_repo write:repo_hook`), adhering to the principle of least privilege.

### F. Injection & XSS Prevention
- All user-controlled text (usernames, repository names, commit messages, and languages) is rendered as standard escaped text in React JSX.
- Zero usage of `dangerouslySetInnerHTML` across the entire codebase.

---

## 2. Infrastructure Protections (Inherited from Cloud Providers)

To be transparent with judges: we do not claim to have built volumetric network mitigation from scratch. We leverage enterprise-grade cloud primitives:

| Layer | Provider | Inherent Protection |
| :--- | :--- | :--- |
| **Edge Network & Anycast CDN** | Vercel | Absorbs Layer 3 and Layer 4 volumetric DDoS attacks. Provides automatic TLS termination, HTTP/2, and global SSL certificates. |
| **Serverless Database** | Neon Postgres | Isolated computes per branch with automated TLS encryption (`sslmode=require`), connection pooling via PgBouncer, and IAM-level role isolation. |
| **Edge Redis Rate Limiting** | Upstash Redis | Low-latency sliding window rate limiter at the edge with fallback to memory store in isolated development environments. |

---

## 3. Quick Reference for Judge Q&A

- **Q: How do you prevent webhook spoofing?**  
  *A:* We verify GitHub's `X-Hub-Signature-256` using HMAC-SHA256 with `crypto.timingSafeEqual` on the raw request bytes before parsing JSON.
- **Q: How do you prevent API scraping or abuse?**  
  *A:* We apply Upstash Redis sliding window rate limits (10 req/min for webhooks, 30 req/min for read endpoints).
- **Q: Are user repositories safe?**  
  *A:* Yes. Our OAuth scope requests only read-only repo metadata and webhook delivery, never write or code execution permissions.
- **Q: Can malicious commit messages inject HTML or scripts?**  
  *A:* No. All fields are parsed through Zod, stored as parameterized text in Postgres, and rendered as escaped text without `dangerouslySetInnerHTML`.
