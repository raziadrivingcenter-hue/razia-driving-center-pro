-- =============================================================================
-- Migration 008 — area-specific travel slot booking (metadata-enabled RPC)
--
-- WHY:
-- The website's Book-a-Slot page can make a `travel_going` slot bookable when
-- the visitor's selected area matches the travel destination. That booking
-- needs to persist the exact vehicle (derived SERVER-SIDE from
-- slot_availability — never trusted from the browser) plus the slot date/start
-- and the travel area into the existing `booking_requests.extra` JSONB column.
-- The original submit_slot_booking overloads have no way to write `extra`, and
-- adding an optional parameter to them would create an ambiguous overload.
--
-- APPROACH — separate, distinctly-named SECURITY DEFINER functions:
--   * submit_slot_booking_with_metadata(...)            — anon (public site)
--   * submit_slot_booking_with_metadata_verified(...)  — service_role only
-- The EXISTING submit_slot_booking overloads (8-arg anon, 9-arg verified) are
-- LEFT COMPLETELY UNTOUCHED, so anonymous bookings, verified-email bookings,
-- the AI-chat path, and the embed path keep working byte-for-byte. Normal
-- (non-travel) bookings still call the original RPCs; only area-travel
-- bookings use the new ones.
--
-- The verified variant carries p_customer_email and is EXECUTE-restricted to
-- service_role, mirroring migration 005 — anon can never supply an email.
--
-- booking_requests.area and booking_requests.extra already exist (nullable).
-- STATUS: customer-run in their Supabase SQL Editor. Safe to run repeatedly.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_slot_booking_with_metadata(
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
    customer_name,
    customer_phone,
    preferred_date,
    preferred_time,
    preferred_course,
    status,
    source,
    message,
    distance_km,
    home_service,
    area,
    extra
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    p_preferred_date,
    p_preferred_time,
    nullif(trim(p_preferred_course), ''),
    'pending',
    'slot-page',
    nullif(trim(v_message), ''),
    coalesce(p_distance_km, 0),
    coalesce(p_home_service, false),
    nullif(trim(p_area), ''),
    p_extra
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_slot_booking_with_metadata_verified(
  -- All eight base parameters are REQUIRED here, mirroring the 9-arg verified
  -- overload in migration 005. PostgreSQL forbids a parameter without a default
  -- after one that has a default (42P13), so p_customer_email must precede the
  -- optional p_area / p_extra. The Cloudflare function always supplies all
  -- eight, exactly as it does for the 005 overload.
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  p_preferred_course text,
  p_distance_km      numeric,
  p_home_service     boolean,
  p_address          text,
  -- REQUIRED (no default) — verified server-side from the Supabase Auth token.
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
    home_service,
    area,
    extra
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
    coalesce(p_home_service, false),
    nullif(trim(p_area), ''),
    p_extra
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Anonymous public site: the metadata RPC is callable by anon ONLY. Revoke the
-- default PUBLIC execute so authenticated cannot use it either.
REVOKE EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata(
  text, text, date, text, text, numeric, boolean, text, text, jsonb
) FROM PUBLIC, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata(
  text, text, date, text, text, numeric, boolean, text, text, jsonb
) TO anon;

-- Verified dashboard bookings: service_role ONLY (the Cloudflare function uses
-- the server-only service-role key for this path). anon can never set email.
REVOKE EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata_verified(
  text, text, date, text, text, numeric, boolean, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_slot_booking_with_metadata_verified(
  text, text, date, text, text, numeric, boolean, text, text, text, jsonb
) TO service_role;

-- Reload the PostgREST schema cache so the new functions are visible immediately.
NOTIFY pgrst, 'reload schema';
