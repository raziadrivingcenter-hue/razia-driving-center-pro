// =============================================================================
// Enrollment requests — new students who aren't in the portal registry yet.
//
// The student's email is treated as read-only and authoritative: it comes from
// the verified Google/Supabase Auth session, never from a form field. The
// request is saved to the private enrollment_requests table via a SECURITY
// DEFINER RPC and left pending — no lessons are created and no course is
// activated until the school processes it.
// =============================================================================

import { supabase } from "./supabase";
import { courses as availableCourses } from "../data/courses";

/**
 * Courses a prospective student can enroll in. Mirrors src/data/courses.js so
 * the selector shows the same names, prices and durations as the public site.
 * The `title` (PLUS/PRO+) is what gets stored on the request.
 */
export const courses = availableCourses.map((c) => ({
  name: c.name,
  title: c.title,
  price: c.price,
  oldPrice: c.oldPrice,
  duration: c.duration,
}));

/**
 * Submit an enrollment request for the authenticated student.
 *
 * The email is captured server-side from auth.uid() inside the RPC, so the
 * caller must not (and cannot) supply it. The request is stored as "pending".
 *
 * @param {{ title: string, name?: string, phone?: string, message?: string }} input
 *   title - the selected course title (e.g. "PLUS Plan").
 * @returns {Promise<string>} the new enrollment request id.
 */
export async function submitEnrollmentRequest(input = {}) {
  const { data, error } = await supabase.rpc("submit_enrollment_request", {
    p_course: input.title ?? null,
    p_name: input.name ?? null,
    p_phone: input.phone ?? null,
    p_message: input.message ?? null,
  });
  if (error) throw error;
  return data;
}
