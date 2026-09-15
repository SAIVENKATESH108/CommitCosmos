import NextAuth, { type DefaultSession } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { redirect } from 'next/navigation';
import { createOrUpdateUserFromGitHub } from '@/db/repositories/userRepository';

// Module augmentation for strong typing on session and user objects
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      githubUsername: string;
      githubId: number;
    } & DefaultSession['user'];
    accessToken?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userId?: string;
    githubUsername?: string;
    githubId?: number;
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET,
      authorization: {
        params: {
          // Principle of least privilege: read-only repo metadata + webhook management
          // NEVER request full write access to user repositories
          scope: 'read:user user:email public_repo write:repo_hook',
        },
      },
    }),
  ],
  // Explicitly confirm and harden security of session cookies
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // First-time sign in: profile and account are available
      if (account && profile) {
        const githubId = Number(profile.id);
        const githubUsername = String(profile.login || profile.name || 'cosmonaut');
        const avatarUrl = profile.avatar_url ? String(profile.avatar_url) : null;

        // Upsert user into database via the repository layer
        const dbUser = await createOrUpdateUserFromGitHub({
          githubId,
          githubUsername,
          avatarUrl,
        });

        token.userId = dbUser.id;
        token.githubId = githubId;
        token.githubUsername = githubUsername;
        // Store the GitHub OAuth access token securely in the server-side JWT
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || '';
        session.user.githubUsername = (token.githubUsername as string) || '';
        session.user.githubId = (token.githubId as number) || 0;
        // Attached to server-side session object (used by server actions/API routes for webhook management)
        session.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

/**
 * Server-side helper to retrieve the authenticated user.
 * Redirects to /sign-in if redirectToSignIn is true and the user is unauthenticated.
 */
export async function getCurrentUser(redirectToSignIn = false) {
  const session = await auth();
  if (!session?.user?.id) {
    if (redirectToSignIn) {
      redirect('/sign-in');
    }
    return null;
  }
  return session.user;
}

/**
 * Server-only helper to securely fetch the GitHub access token for webhook and repo operations.
 * Never exposed to client-side components.
 */
export async function getGitHubAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session) return null;
  return session.accessToken || null;
}


