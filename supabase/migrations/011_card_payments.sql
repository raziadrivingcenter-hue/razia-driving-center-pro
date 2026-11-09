-- =============================================================================
-- Migration 011 — online card payments (PayFast or any provider)
--
-- Adds the payment lifecycle to booking_requests and two new tables:
--   payment_events      — idempotency ledger; one row per gateway event
--   booking_slot_holds  — a 15-minute claim on a slot while payment completes
--
-- The hold deliberately lives in its OWN table. slot_availability is synced
-- from the SOD desktop app; writing a hold there would be overwritten on the
-- next sync and would fight the desktop for ownership of the row.
--
-- Nothing here changes the existing booking path. Payment On Arrival still
-- inserts status 'pending' through the unchanged RPCs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extended booking status values
-- -----------------------------------------------------------------------------
-- Existing values: pending | confirmed | cancelled
-- New values:
--   pending_payment   → slot held, gateway checkout in progress
--   paid              → webhook verified the payment
--   payment_failed    → gateway reported a failure
--   payment_cancelled → customer cancelled at the gateway
--   expired           → the hold elapsed with no payment
--
-- Any check constraint already on the status column is replaced, because the
-- table's DDL is not fully captured in earlier migrations.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = 'booking_requests'
       AND c.contype = 'c'
       AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.booking_requests DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;
ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'cancelled',
    'pending_payment', 'paid', 'payment_failed', 'payment_cancelled', 'expired'
  ));

-- -----------------------------------------------------------------------------
-- 2. Payment columns on booking_requests
-- -----------------------------------------------------------------------------
-- course_fee / distance_fee / total_fee are added rather than assumed: the
-- table's DDL is not fully captured in the earlier migrations, and the amount
-- charged must be the SERVER-CALCULATED value, stored, so a gateway event can
-- be checked against it.
-- -----------------------------------------------------------------------------
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS course_fee    numeric(10,2);
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS distance_fee  numeric(10,2);
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS total_fee     numeric(10,2);

ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS payment_method         text;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS distance_source        text;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS payment_transaction_id text;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS amount_charged         numeric(10,2);
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS amount_currency        text;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS payment_verified_at    timestamptz;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS checkout_reference     text;

COMMENT ON COLUMN public.booking_requests.distance_source IS
  'map = derived from coordinates by the server; manual = typed by the customer (never payable online)';

-- -----------------------------------------------------------------------------
-- 3. payment_events — the idempotency ledger
-- -----------------------------------------------------------------------------
-- The primary key IS the dedupe mechanism. A repeated delivery inserts
-- nothing (ON CONFLICT / Prefer: resolution=ignore-duplicates), and the empty
-- result tells the webhook to ack and stop. No card data is ever stored here.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  event_id           text        PRIMARY KEY,
  provider           text        NOT NULL,
  booking_ref        text,
  status             text        NOT NULL,
  provider_reference text,
  amount             numeric(10,2),
  currency           text,
  raw                jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_events_booking_ref
  ON public.payment_events (booking_ref);
CREATE INDEX IF NOT EXISTS payment_events_created
  ON public.payment_events (created_at DESC);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
-- No grants: service_role only (it bypasses RLS). anon cannot read or write.

-- -----------------------------------------------------------------------------
-- 4. booking_slot_holds
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_slot_holds (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id   uuid        NOT NULL,
  slot_date    date        NOT NULL,
  slot_start   text        NOT NULL,
  vehicle_id   bigint,
  area         text,
  status       text        NOT NULL DEFAULT 'pending',
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  released_at  timestamptz
);

ALTER TABLE public.booking_slot_holds ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS booking_slot_holds_booking
  ON public.booking_slot_holds (booking_id);
CREATE INDEX IF NOT EXISTS booking_slot_holds_live
  ON public.booking_slot_holds (slot_date, slot_start);

-- The atomic guard against two live checkouts on one slot. A second INSERT
-- fails with a unique violation, which the endpoint surfaces as 409.
-- vehicle_id is coalesced so NULL (a normal booking has no resolved vehicle)
-- still participates in the uniqueness rule.
CREATE UNIQUE INDEX IF NOT EXISTS booking_slot_holds_one_live_hold
  ON public.booking_slot_holds (slot_date, slot_start, (COALESCE(vehicle_id, 0)))
  WHERE status = 'pending';

COMMENT ON TABLE public.booking_slot_holds IS
  'Temporary slot claim during card checkout. Never write holds to slot_availability (SOD-synced).';

-- -----------------------------------------------------------------------------
-- 5. create_card_booking — booking + hold in one transaction
-- -----------------------------------------------------------------------------
-- Called with the SERVICE ROLE key only. The amounts passed in were computed
-- server-side from coordinates; this function never derives a price itself.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_card_booking(
  p_customer_name    text,
  p_customer_phone   text,
  p_preferred_date   date,
  p_preferred_time   text,
  p_preferred_course text,
  p_distance_km      numeric,
  p_home_service     boolean,
  p_address          text,
  p_area             text,
  p_vehicle_id       bigint,
  p_distance_source  text,
  p_course_fee       numeric,
  p_distance_fee     numeric,
  p_total_fee        numeric,
  p_customer_email   text   DEFAULT NULL,
  p_hold_minutes     integer DEFAULT 15
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     uuid;
  v_time   text;
  v_source text;
  v_expires timestamptz;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'customer_phone is required';
  END IF;
  IF p_total_fee IS NULL OR p_total_fee <= 0 THEN
    RAISE EXCEPTION 'total_fee must be positive';
  END IF;
  IF p_hold_minutes IS NULL OR p_hold_minutes <= 0 THEN
    p_hold_minutes := 15;
  END IF;

  v_time    := to_char(p_preferred_time::time, 'HH24:MI');
  v_expires := now() + (p_hold_minutes || ' minutes')::interval;
  v_source  := CASE WHEN p_home_service THEN COALESCE(p_distance_source, 'map') ELSE 'none' END;

  INSERT INTO public.booking_requests (
    customer_name, customer_phone, customer_email,
    preferred_date, preferred_time, preferred_course,
    status, source, message,
    distance_km, home_service, address, area,
    course_fee, distance_fee, total_fee, amount_currency,
    payment_method, distance_source
  ) VALUES (
    trim(p_customer_name), trim(p_customer_phone), nullif(trim(p_customer_email), ''),
    p_preferred_date, v_time, nullif(trim(p_preferred_course), ''),
    'pending_payment', 'slot-page-card',
    'Card checkout started: ' || p_preferred_date || ' at ' || v_time,
    coalesce(p_distance_km, 0), coalesce(p_home_service, false),
    nullif(trim(p_address), ''), nullif(trim(p_area), ''),
    p_course_fee, p_distance_fee, p_total_fee, 'PKR',
    'debit_card', v_source
  )
  RETURNING id INTO v_id;

  INSERT INTO public.booking_slot_holds (
    booking_id, slot_date, slot_start, vehicle_id, area, status, expires_at
  ) VALUES (
    v_id, p_preferred_date, v_time, coalesce(p_vehicle_id, 0),
    nullif(trim(p_area), ''), 'pending', v_expires
  );

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_card_booking(
  text, text, date, text, text, numeric, boolean, text, text,
  bigint, text, numeric, numeric, numeric, text, integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_card_booking(
  text, text, date, text, text, numeric, boolean, text, text,
  bigint, text, numeric, numeric, numeric, text, integer
) TO service_role;

-- -----------------------------------------------------------------------------
-- 6. expire_stale_card_bookings — releases holds whose window has passed
-- -----------------------------------------------------------------------------
-- Idempotent. Intended for a scheduled trigger; the status endpoint also
-- applies the same transition lazily, so expiry works before a cron is set up.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_stale_card_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released integer;
  v_expired  integer;
BEGIN
  UPDATE public.booking_slot_holds
     SET status = 'expired', released_at = now()
   WHERE status = 'pending'
     AND expires_at < now();
  GET DIAGNOSTICS v_released = ROW_COUNT;

  UPDATE public.booking_requests b
     SET status = 'expired'
   WHERE b.status = 'pending_payment'
     AND EXISTS (
       SELECT 1 FROM public.booking_slot_holds h
        WHERE h.booking_id = b.id
          AND h.status = 'expired'
     );
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  RETURN v_released + v_expired;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_card_bookings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_card_bookings() TO service_role;
