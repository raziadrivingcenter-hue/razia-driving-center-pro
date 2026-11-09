/* ------------------------------------------------------------------ */
/*  Server-side verification of a dashboard (Supabase) access token.   */
/*                                                                    */
/*  Mirrors the identity block in functions/api/v1/slot-booking.js.     */
/*  Duplicated rather than extracted so the live booking endpoint is    */
/*  left untouched.                                                    */
/*                                                                    */
/*  The email is derived from the VERIFIED Auth user — never from the   */
/*  request body — so a caller cannot impersonate a signed-in student.  */
/* ------------------------------------------------------------------ */

/**
 * @param {{ fetchImpl?: Function, supabaseUrl: string, anonKey: string,
 *           request: Request }} args
 * @returns {Promise<{ok: true, email: string|null} | {ok: false, status: number, error: string}>}
 */
export async function verifyDashboardToken({
  fetchImpl = fetch,
  supabaseUrl,
  anonKey,
  request,
}) {
  const authHeader = request?.headers?.get?.("Authorization");
  // No header → anonymous public booking.
  if (!authHeader) return { ok: true, email: null };

  const tokenMatch = /^Bearer\s+(\S+)$/i.exec(authHeader.trim());
  if (!tokenMatch) {
    return {
      ok: false,
      status: 401,
      error: "Malformed authorization header. Please sign in again to book.",
    };
  }

  const token = tokenMatch[1];
  if (!token || token === anonKey) {
    return {
      ok: false,
      status: 401,
      error: "No valid sign-in provided. Please sign in again to book.",
    };
  }

  let user;
  try {
    const userRes = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return {
        ok: false,
        status: 401,
        error: "Your sign-in is invalid or expired. Please sign in again to book.",
      };
    }
    user = await userRes.json();
  } catch (error) {
    console.error("Token verification error:", error);
    return {
      ok: false,
      status: 503,
      error: "We could not verify your sign-in. Please try again shortly.",
    };
  }

  const email = user?.email || "";
  if (!email || !user?.email_confirmed_at) {
    const reason = !email
      ? "Your account has no email on file."
      : "Your email is not confirmed yet.";
    return {
      ok: false,
      status: 403,
      error: `${reason} Please sign in again or confirm your email to book.`,
    };
  }

  return { ok: true, email };
}
