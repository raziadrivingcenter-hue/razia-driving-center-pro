-- =============================================================================
-- Migration 003 — Secure slot-booking RPC
--
-- Root cause: the anon role had NO privileges on public.booking_requests,
-- so every insert (wizard + slot-page) failed with Postgres error 42501
-- (permission denied), which crashed the Cloudflare Pages Function (HTTP 502).
--
-- Fix: a SECURITY DEFINER RPC. anon is granted EXECUTE only — it cannot
-- SELECT or INSERT the table directly (student names/phones stay private).
-- The function runs with the creator's privileges to perform the insert
-- and returns only the new booking id.
-- =============================================================================

-- Ensure RLS is on (defense in depth — direct table access stays locked down)
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Function used by the /api/v1/slot-booking endpoint (name + phone + slot).
-- booking_requests.id is a UUID, so this returns uuid (not bigint).
-- Drop first so the return type can change if an older version exists.
DROP FUNCTION IF EXISTS public.submit_slot_booking(text, text, date, text);
CREATE FUNCTION public.submit_slot_booking(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;

  INSERT INTO public.booking_requests (
    customer_name,
    customer_phone,
    preferred_date,
    preferred_time,
    preferred_course,
    status,
    source,
    message
  ) VALUES (
    trim(p_customer_name),
    trim(p_customer_phone),
    p_preferred_date,
    p_preferred_time,
    'Slot Booking',
    'pending',
    'slot-page',
    'Slot booking via website: ' || p_preferred_date || ' at ' || p_preferred_time
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- anon may call the function but NOT touch the table directly
GRANT EXECUTE ON FUNCTION public.submit_slot_booking TO anon;

-- =============================================================================
-- Optional: fix the existing wizard endpoint (/api/v1/bookings) which had the
-- same permission problem. Uncomment if the wizard booking is also broken.
-- =============================================================================
-- CREATE OR REPLACE FUNCTION public.submit_wizard_booking(
--   p_customer_name    text,
--   p_customer_phone   text,
--   p_customer_email   text,
--   p_preferred_course text,
--   p_area             text,
--   p_preferred_date   date,
--   p_preferred_time   text,
--   p_distance_km      numeric,
--   p_message          text
-- )
-- RETURNS bigint
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- DECLARE
--   v_id bigint;
-- BEGIN
--   INSERT INTO public.booking_requests (
--     customer_name, customer_phone, customer_email, preferred_course,
--     status, source, area, preferred_date, preferred_time,
--     distance_km, home_service, message
--   ) VALUES (
--     trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email),''),
--     p_preferred_course, 'pending', 'website', nullif(trim(p_area),''),
--     p_preferred_date, p_preferred_time,
--     coalesce(p_distance_km, 0),
--     coalesce(p_distance_km, 0) > 0,
--     nullif(trim(p_message),'')
--   )
--   RETURNING id INTO v_id;
--   RETURN v_id;
-- END;
-- $$;
-- GRANT EXECUTE ON FUNCTION public.submit_wizard_booking TO anon;
