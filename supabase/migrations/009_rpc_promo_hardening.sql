-- =============================================================================
-- Migration 009 — RPC promo hardening (REVIEW DRAFT — NOT APPLIED)
--
-- WHY:
-- Migration 008's metadata RPCs insert `p_extra` verbatim into
-- `booking_requests.extra`. The Cloudflare function derives `promo_requested`
-- server-side from the matched slot_availability tile, but the RPC itself trusts
-- whatever the caller sends — so a direct anon call could forge a discount.
--
-- This migration makes the RPC recompute `promo_requested` from
-- `slot_availability` and ignore any client-supplied value, using the SAME rules
-- as functions/api/v1/slot-booking.js:
--   * the slot is bookable only when an 'available' row exists for the
--     date/time, OR a 'blocked' row with block_reason in
--     ('travel_going','travel_returning') whose normalized area equals the
--     normalized p_area;
--   * when an 'available' row wins, the booking is normal and carries no promo;
--   * otherwise the matched travel tile (lowest vehicle_id) is used, and
--     promo_requested is taken from its promo_percent ONLY when its normalized
--     promo_area equals p_area — otherwise the key is removed;
--   * any client-supplied promo_requested in p_extra is always overwritten or
--     removed.
--
-- Area normalization (both sides) matches the JavaScript normalizeAreaKey:
--   lower(regexp_replace(btrim(x), '\s+', ' ', 'g'))
--
-- ROLLBACK / PRE-MIGRATION CAPTURE:
-- Run these BEFORE applying this script. They capture the current definitions so
-- you can restore them if the migration must be reverted.
--
--   SELECT pg_get_functiondef('public.submit_slot_booking_with_metadata(text,text,date,text,text,numeric,boolean,text,text,jsonb)'::regprocedure);
--   SELECT pg_get_functiondef('public.submit_slot_booking_with_metadata_verified(text,text,date,text,text,numeric,boolean,text,text,text,jsonb)'::regprocedure);
--
-- This script is wrapped in BEGIN/COMMIT. If any statement fails, PostgreSQL
-- rolls the whole transaction back and the pre-existing functions remain.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: recompute promo_requested from slot_availability.
-- SECURITY DEFINER so the anon-callable RPCs can read the table; EXECUTE is
-- revoked from PUBLIC/anon/authenticated below, so only the definer-owned RPCs
-- can call it.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.derive_slot_promo_for_booking(date, text, text, jsonb);

CREATE FUNCTION public.derive_slot_promo_for_booking(
  p_date  date,
  p_time  text,
  p_area  text,
  p_extra jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date              text := to_char(p_date, 'YYYY-MM-DD');
  v_time              text := concat(
                            lpad(split_part(p_time, ':', 1), 2, '0'),
                            ':',
                            split_part(p_time, ':', 2)
                          );
  v_area              text := lower(regexp_replace(btrim(COALESCE(p_area, '')), '\s+', ' ', 'g'));
  v_extra             jsonb := COALESCE(p_extra, '{}'::jsonb);
  v_available         boolean := false;
  v_travel            boolean := false;
  v_matched_percent   integer := null;
  v_matched_promo_key text := null;
  v_promo             integer := null;
BEGIN
  -- (a) Bookable only when an 'available' row exists, or a claimable travel
  --     row whose normalized area equals the normalized p_area.
  SELECT EXISTS (
    SELECT 1
      FROM public.slot_availability s
     WHERE s.slot_date = v_date
       AND left(s.slot_start, 5) = v_time
       AND s.status = 'available'
  ) INTO v_available;

  SELECT EXISTS (
    SELECT 1
      FROM public.slot_availability s
     WHERE s.slot_date = v_date
       AND left(s.slot_start, 5) = v_time
       AND s.status = 'blocked'
       AND s.block_reason IN ('travel_going', 'travel_returning')
       AND v_area <> ''
       AND lower(regexp_replace(btrim(COALESCE(s.area, '')), '\s+', ' ', 'g')) = v_area
  ) INTO v_travel;

  IF NOT v_available AND NOT v_travel THEN
    RAISE EXCEPTION 'slot is not bookable';
  END IF;

  -- (b) An 'available' row wins -> normal booking, no promo. Otherwise use the
  --     matched travel tile (lowest vehicle_id, mirroring slot-booking.js) and
  --     take promo_requested from its promo_percent only when its normalized
  --     promo_area equals p_area.
  IF NOT v_available AND v_travel THEN
    SELECT s.promo_percent,
           lower(regexp_replace(btrim(COALESCE(s.promo_area, '')), '\s+', ' ', 'g'))
      INTO v_matched_percent, v_matched_promo_key
      FROM public.slot_availability s
     WHERE s.slot_date = v_date
       AND left(s.slot_start, 5) = v_time
       AND s.status = 'blocked'
       AND s.block_reason IN ('travel_going', 'travel_returning')
       AND v_area <> ''
       AND lower(regexp_replace(btrim(COALESCE(s.area, '')), '\s+', ' ', 'g')) = v_area
     ORDER BY s.vehicle_id ASC
     LIMIT 1;

    IF v_matched_percent IS NOT NULL
       AND v_matched_promo_key = v_area THEN
      v_promo := v_matched_percent;
    END IF;
  END IF;

  -- (c) Never trust a client promo value: always overwrite or remove.
  IF v_promo IS NOT NULL THEN
    v_extra := v_extra || jsonb_build_object('promo_requested', v_promo);
  ELSE
    v_extra := v_extra - 'promo_requested';
  END IF;

  RETURN v_extra;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.derive_slot_promo_for_booking(date, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Drop EVERY overload of the two metadata functions, so the CREATEs below are
-- unambiguous even if an older signature is still present. This deliberately
-- does NOT touch the original submit_slot_booking overloads.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
      FROM pg_proc
     WHERE proname IN ('submit_slot_booking_with_metadata',
                       'submit_slot_booking_with_metadata_verified')
       AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig::text;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Anon metadata RPC: identical signature, extra is sanitized before insert.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.submit_slot_booking_with_metadata(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  p_preferred_course text DEFAULT NULL,
  p_distance_km      numeric DEFAULT 0,
  p_home_service     boolean DEFAULT false,
  p_address          text DEFAULT NULL,
  p_area             text DEFAULT NULL,
  p_extra            jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      uuid;
  v_message text;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;

  v_message := 'Area travel slot booking via website: ' || p_preferred_date || ' at ' || p_preferred_time;
  IF p_area IS NOT NULL AND length(trim(p_area)) > 0 THEN
    v_message := v_message || ' | Area: ' || trim(p_area);
  END IF;
  IF p_preferred_course IS NOT NULL AND length(trim(p_preferred_course)) > 0 THEN
    v_message := v_message || ' | Course: ' || trim(p_preferred_course);
  END IF;
  IF p_home_service AND p_address IS NOT NULL AND length(trim(p_address)) > 0 THEN
    v_message := v_message || ' | Pick&Drop: ' || trim(p_address);
  END IF;

  INSERT INTO public.booking_requests (
    customer_name, customer_phone, preferred_date, preferred_time,
    preferred_course, status, source, message, distance_km, home_service,
    area, extra
  ) VALUES (
    trim(p_customer_name), trim(p_customer_phone), p_preferred_date,
    p_preferred_time, nullif(trim(p_preferred_course), ''), 'pending',
    'slot-page', nullif(trim(v_message), ''), coalesce(p_distance_km, 0),
    coalesce(p_home_service, false), nullif(trim(p_area), ''),
    public.derive_slot_promo_for_booking(p_preferred_date, p_preferred_time, p_area, p_extra)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Verified metadata RPC: same sanitization.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.submit_slot_booking_with_metadata_verified(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  p_preferred_course text,
  p_distance_km      numeric,
  p_home_service     boolean,
  p_address          text,
  p_customer_email   text,
  p_area             text   DEFAULT NULL,
  p_extra            jsonb  DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      uuid;
  v_message text;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;

  v_message := 'Area travel slot booking via website: ' || p_preferred_date || ' at ' || p_preferred_time;
  IF p_area IS NOT NULL AND length(trim(p_area)) > 0 THEN
    v_message := v_message || ' | Area: ' || trim(p_area);
  END IF;
  IF p_preferred_course IS NOT NULL AND length(trim(p_preferred_course)) > 0 THEN
    v_message := v_message || ' | Course: ' || trim(p_preferred_course);
  END IF;
  IF p_home_service AND p_address IS NOT NULL AND length(trim(p_address)) > 0 THEN
    v_message := v_message || ' | Pick&Drop: ' || trim(p_address);
  END IF;

  INSERT INTO public.booking_requests (
    customer_name, customer_phone, customer_email, preferred_date,
    preferred_time, preferred_course, status, source, message, distance_km,
    home_service, area, extra
  ) VALUES (
    trim(p_customer_name), trim(p_customer_phone), trim(p_customer_email),
    p_preferred_date, p_preferred_time, nullif(trim(p_preferred_course), ''),
    'pending', 'slot-page', nullif(trim(v_message), ''),
    coalesce(p_distance_km, 0), coalesce(p_home_service, false),
    nullif(trim(p_area), ''),
    public.derive_slot_promo_for_booking(p_preferred_date, p_preferred_time, p_area, p_extra)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants (unchanged from migration 008).
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata(
  text, text, date, text, text, numeric, boolean, text, text, jsonb
) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata(
  text, text, date, text, text, numeric, boolean, text, text, jsonb
) TO anon;

REVOKE EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata_verified(
  text, text, date, text, text, numeric, boolean, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata_verified(
  text, text, date, text, text, numeric, boolean, text, text, text, jsonb
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
