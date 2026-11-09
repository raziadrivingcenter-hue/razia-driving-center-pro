-- =============================================================================
-- ROLLBACK for migration 011 — online card payments
--
-- Run this instead of 011 to remove everything it added. It is DESTRUCTIVE:
--   * the payment ledger (payment_events) is deleted
--   * the slot-hold table (booking_slot_holds) is deleted
--   * the ten payment columns are dropped from booking_requests
--
-- It does NOT touch any booking row, and it does NOT touch slot_availability.
--
-- SAFETY GATE: the script refuses to run while ANY booking_requests row still
-- carries a payment status (pending_payment / paid / payment_failed /
-- payment_cancelled / expired). Those rows represent real money or a real
-- 15-minute claim, so a human must resolve them first — refund and delete, or
-- move the row back to 'pending'/'confirmed' if the payment never happened.
--
-- Wrapped in BEGIN/COMMIT: if any statement fails, everything rolls back.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Safety gate — refuse while payment-status rows exist
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.booking_requests
   WHERE status IN ('pending_payment', 'paid', 'payment_failed',
                    'payment_cancelled', 'expired');

  IF v_count > 0 THEN
    RAISE EXCEPTION
      'Cannot roll back migration 011: % booking_requests row(s) still use a payment status. Resolve them first (refund + delete, or set them back to pending/confirmed).', v_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Slot-claim guard (the hold check added to the booking path)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS booking_requests_slot_guard ON public.booking_requests;
DROP FUNCTION IF EXISTS public.booking_requests_slot_guard();
DROP FUNCTION IF EXISTS public.slot_is_held(date, text);

-- ---------------------------------------------------------------------------
-- 2. Functions added by 011
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_card_booking(
  text, text, date, text, text, numeric, boolean, text, text,
  bigint, text, numeric, numeric, numeric, text, integer
);
DROP FUNCTION IF EXISTS public.expire_stale_card_bookings();

-- ---------------------------------------------------------------------------
-- 3. Tables added by 011
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.payment_events;
DROP TABLE IF EXISTS public.booking_slot_holds;

-- ---------------------------------------------------------------------------
-- 4. Columns added by 011
-- ---------------------------------------------------------------------------
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS course_fee;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS distance_fee;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS total_fee;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS payment_method;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS distance_source;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS payment_transaction_id;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS amount_charged;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS amount_currency;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS payment_verified_at;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS checkout_reference;

-- ---------------------------------------------------------------------------
-- 5. Restore the original status constraint (pending | confirmed | cancelled)
-- ---------------------------------------------------------------------------
-- Safe because step 0 guaranteed no row uses a payment status.
ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_status_check;
ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled'));

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- AFTER RUNNING THIS
--
-- 1. Delete the Pages cron binding for functions/_scheduled.js (if one was
--    created) — it will now fail on a missing function.
-- 2. Remove the payment env vars from the Pages environment:
--    PAYMENTS_CARD_ENABLED, PAYMENT_PROVIDER, PAYMENT_WEBHOOK_SECRET,
--    PAYMENTS_ALLOW_MOCK, PAYFAST_*, SAFEPAY_*.
-- 3. Redeploy, or let the next deploy pick up the change. Until then the card
--    option is hidden because PAYMENTS_CARD_ENABLED is unset/false.
-- =============================================================================
