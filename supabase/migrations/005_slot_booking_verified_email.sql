-- =============================================================================
-- Migration 005 — add a verified-email overload of submit_slot_booking
--
-- WHY:
-- The student dashboard now routes enrollment through the LIVE slot-booking
-- flow (/slot-availability/ → BookingForm) instead of the separate
-- enrollment_requests table. Dashboard bookings carry a Supabase access token
-- that this endpoint verifies server-side via the Auth user endpoint; the
-- verified email is then persisted on the booking so the school has a contact.
--
-- APPROACH — PostgreSQL function overloading:
--   * The EXISTING 8-argument submit_slot_booking(...) is LEFT UNTOUCHED.
--     Anonymous public bookings call it → customer_email stays NULL (the
--     column already exists as nullable text and defaults to NULL).
--   * We ADD a new 9-argument overload whose last parameter, p_customer_email,
--     is REQUIRED (no DEFAULT). Because the signatures differ only in arity,
--     PostgreSQL resolves the call unambiguously by argument count:
--       - 8 args  → anonymous public booking (email column stays NULL)
--       - 9 args  → verified dashboard booking (email persisted)
--
-- This keeps every existing caller working byte-for-byte while giving
-- dashboard bookings a distinct, email-aware path.
--
-- booking_requests.customer_email already exists (text, nullable).
-- STATUS: NOT YET EXECUTED — apply to production after review.
-- =============================================================================

-- All nine parameters are REQUIRED (no DEFAULTs). PostgreSQL still resolves
-- the overload by arity (9 vs the existing 8), and requiring every argument
-- makes the call shape explicit — a caller must supply a real value (or an
-- explicit NULL) for course, distance, home service, and address.
CREATE FUNCTION public.submit_slot_booking(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  p_preferred_course text,
  p_distance_km      numeric,
  p_home_service     boolean,
  p_address          text,
  -- REQUIRED (no default) → distinguishes this overload from the 8-arg version.
  -- Verified server-side from the Supabase Auth access token before the call.
  p_customer_email   text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     uuid;
  v_message text;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;

  -- Build a human-readable message for staff (same style as the 8-arg version)
  v_message := 'Slot booking via website: ' || p_preferred_date || ' at ' || p_preferred_time;
  IF p_preferred_course IS NOT NULL AND length(trim(p_preferred_course)) > 0 THEN
    v_message := v_message || ' | Course: ' || trim(p_preferred_course);
  END IF;
  IF p_home_service AND p_address IS NOT NULL AND length(trim(p_address)) > 0 THEN
    v_message := v_message || ' | Pick&Drop: ' || trim(p_address);
  END IF;

  INSERT INTO public.booking_requests (
    customer_name,
    customer_phone,
    customer_email,
    preferred_date,
    preferred_time,
    preferred_course,
    status,
    source,
    message,
    distance_km,
    home_service
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_customer_email),
    p_preferred_date,
    p_preferred_time,
    nullif(trim(p_preferred_course), ''),
    'pending',
    'slot-page',
    nullif(trim(v_message), ''),
    coalesce(p_distance_km, 0),
    coalesce(p_home_service, false)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- The 9-arg overload writes the verified email, so it must NOT be callable by
-- the public/anon website role (which has no business supplying an email, and
-- could not be trusted with one anyway). Revoke any default PUBLIC access and
-- explicitly grant EXECUTE to service_role only — the Cloudflare function uses
-- the service-role key for this path.
REVOKE EXECUTE ON FUNCTION public.submit_slot_booking(
  text, text, date, text, text, numeric, boolean, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_slot_booking(
  text, text, date, text, text, numeric, boolean, text, text
) TO service_role;

-- The 8-arg overload's anon grant is already in place from migration 004 and is
-- untouched; anonymous public bookings continue to use it.
