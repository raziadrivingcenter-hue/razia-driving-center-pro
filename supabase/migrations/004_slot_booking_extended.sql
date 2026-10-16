-- =============================================================================
-- Migration 004 — extend submit_slot_booking RPC with course + pick&drop fields
--
-- The slot page now collects course selection and pick&drop info (like the
-- booking wizard). Add optional parameters with defaults so existing callers
-- (name + phone + date + time) keep working — the old 4-arg form still resolves.
-- =============================================================================

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS public.submit_slot_booking(text, text, date, text);
CREATE FUNCTION public.submit_slot_booking(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  -- optional fields (slot-page registration form)
  p_preferred_course text   DEFAULT NULL,
  p_distance_km      numeric DEFAULT 0,
  p_home_service     boolean DEFAULT false,
  p_address          text   DEFAULT NULL
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

  -- Build a human-readable message for staff (same style as the wizard endpoint)
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

-- anon may call the function but NOT touch the table directly
GRANT EXECUTE ON FUNCTION public.submit_slot_booking TO anon;
