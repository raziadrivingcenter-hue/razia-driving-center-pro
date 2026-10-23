// =============================================================================
// Student progress data access — calls the SECURITY DEFINER RPCs.
//
// The public website only has EXECUTE on these functions (granted by the
// setup SQL). It cannot read lessons / lesson_tracking_sessions / student_link
// directly, so per-student isolation is enforced entirely server-side.
// =============================================================================

import { supabase } from "./supabase";

/**
 * Does the current auth user have a linked student record?
 * Returns true if the current auth user has an admin-created link.
 * The RPC returns a boolean, so no student identifiers leave the database.
 */
export async function getMyLink() {
  const { data, error } = await supabase.rpc("get_my_link");
  if (error) throw error;
  // RPC returns a scalar boolean.
  return data === true;
}

/** Current student's lessons joined with their GPS-tracking sessions. */
export async function fetchMyProgress() {
  const { data, error } = await supabase.rpc("get_my_progress");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// =============================================================================
// New portal-identity flow (student_portal_registry).
//
// The website never reads student_portal_registry directly (it is private,
// service-role only). These RPCs resolve the authenticated Google email to a
// student record entirely server-side and report back only a coarse status.
// =============================================================================

/**
 * Resolve the current auth user to a student record via their verified Google
 * email matched against the private student_portal_registry.
 *
 * Server-side only: the email is read from auth.users (never the client), the
 * registry is private, and only a status + student_id leak back.
 *
 * @returns {Promise<{status: string, student_id: number|null, source: string|null}>}
 *   status ∈ "linked" | "no_match" | "no_course" | "multiple"
 *   source ∈ "registry" | "legacy_link" | null
 */
export async function resolvePortalStudent() {
  const { data, error } = await supabase.rpc("resolve_portal_student");
  if (error) throw error;
  // RPC returns a single-row table; normalise to one object.
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? { status: "no_match", student_id: null, source: null };
}

/**
 * Current student's lessons joined with their GPS-tracking sessions, resolved
 * through the portal identity (registry → lessons). Returns rows only when the
 * current auth user resolves to exactly one student with lessons.
 *
 * @returns {Promise<Array>}
 */
export async function fetchPortalProgress() {
  const { data, error } = await supabase.rpc("get_portal_progress");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
