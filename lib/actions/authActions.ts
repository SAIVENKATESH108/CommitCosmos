'use server';

import { signIn, signOut } from '@/lib/auth';

/**
 * Initiates the GitHub OAuth sign-in flow and redirects to the dashboard upon success.
 */
export async function signInAction() {
  await signIn('github', { redirectTo: '/dashboard' });
}

/**
 * Signs out the current user and clears session cookies.
 */
export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
