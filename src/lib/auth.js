// =============================================================================
// Auth session helper — wraps the shared Supabase anon client.
//
// The website uses Supabase Auth (Google OAuth) for student sign-in. The
// session is held server-side by Supabase; the client only stores the
// short-lived access + refresh tokens in localStorage (managed by the Supabase
// JS SDK). No service-role key or secret ever touches the browser.
// =============================================================================

import { supabase } from "./supabase";

/** Resolve the current session (null on first load / signed out). */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return data.session;
}

/**
 * Sign in with Google via Supabase OAuth. The whole page redirects to Google,
 * then back to redirectTo. The returned session is established by Supabase JS
 * on the landing page.
 */
export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/dashboard/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "consent" },
    },
  });
  if (error) throw error;
}

/** Sign out and clear the local session. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to auth-state changes. Callback receives the user object (or null).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
