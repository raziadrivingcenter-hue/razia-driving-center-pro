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
