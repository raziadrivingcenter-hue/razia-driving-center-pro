-- =============================================================================
-- Migration 009 — REVIEW TESTS (run manually after 009_rpc_promo_hardening.sql)
--
-- Each block is self-contained: it inserts its own fixture rows, and deletes
-- them at the end. A DO block runs in one transaction, so if any assertion
-- fails the whole block rolls back and the fixtures disappear with it — the
-- explicit DELETEs cover the success path (and the EXCEPTION-handler path in
-- the rejection tests). Safe to re-run against the same database.
--
-- All fixtures use 2030-01-15 and vehicle_id 9001-9006 so they never collide
-- with real data or with each other.
--
-- slot_availability required columns: vehicle_id, slot_date (TEXT), slot_start,
-- slot_end, status. Unique key: (slot_date, vehicle_id, slot_start).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Test 1 — available slot: accepted, and a client-supplied promo is removed.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra jsonb;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status, synced_at)
  VALUES
    ('2030-01-15', 9001, 'Review Car', '14:00', '14:30', 'available', now());

  v_extra := public.derive_slot_promo_for_booking(
    '2030-01-15'::date, '14:00', NULL, '{"promo_requested": 100}'::jsonb
  );

  IF v_extra ? 'promo_requested' THEN
    RAISE EXCEPTION 'test 1 failed: available slot must not carry promo_requested (got %)', v_extra;
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9001 AND slot_start = '14:00';

  RAISE NOTICE 'test 1 passed: available slot accepted, client promo removed';
END $$;


-- ---------------------------------------------------------------------------
-- Test 2 — claimable returning tile with matching area: promo stored.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra jsonb;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, promo_percent, promo_area, synced_at)
  VALUES
    ('2030-01-15', 9002, 'Review Car', '14:00', '14:30', 'blocked',
     'travel_returning', 'Wapda Town', 10, 'Wapda Town', now());

  v_extra := public.derive_slot_promo_for_booking(
    '2030-01-15'::date, '14:00', 'Wapda Town', '{}'::jsonb
  );

  IF v_extra ->> 'promo_requested' IS DISTINCT FROM '10' THEN
    RAISE EXCEPTION 'test 2 failed: expected promo_requested 10, got %', v_extra;
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9002 AND slot_start = '14:00';

  RAISE NOTICE 'test 2 passed: returning tile with matching area stores promo 10';
END $$;


-- ---------------------------------------------------------------------------
-- Test 3 — same tile, different area: rejected.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra  jsonb;
  v_failed boolean := false;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, promo_percent, promo_area, synced_at)
  VALUES
    ('2030-01-15', 9003, 'Review Car', '14:00', '14:30', 'blocked',
     'travel_returning', 'Wapda Town', 10, 'Wapda Town', now());

  BEGIN
    v_extra := public.derive_slot_promo_for_booking(
      '2030-01-15'::date, '14:00', 'Model Town', '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 3 failed: a travel tile for a different area must be rejected';
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9003 AND slot_start = '14:00';

  RAISE NOTICE 'test 3 passed: different-area tile rejected';
END $$;


-- ---------------------------------------------------------------------------
-- Test 4 — forged promo of 100 in p_extra: the published value is stored.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra jsonb;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, promo_percent, promo_area, synced_at)
  VALUES
    ('2030-01-15', 9004, 'Review Car', '14:00', '14:30', 'blocked',
     'travel_going', 'Wapda Town', 10, 'Wapda Town', now());

  v_extra := public.derive_slot_promo_for_booking(
    '2030-01-15'::date, '14:00', 'Wapda Town', '{"promo_requested": 100}'::jsonb
  );

  IF v_extra ->> 'promo_requested' IS DISTINCT FROM '10' THEN
    RAISE EXCEPTION 'test 4 failed: forged promo must be replaced by 10, got %', v_extra;
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9004 AND slot_start = '14:00';

  RAISE NOTICE 'test 4 passed: forged promo 100 replaced by published 10';
END $$;


-- ---------------------------------------------------------------------------
-- Test 5 — blocked tile for another area: rejected.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra  jsonb;
  v_failed boolean := false;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, promo_percent, promo_area, synced_at)
  VALUES
    ('2030-01-15', 9005, 'Review Car', '14:00', '14:30', 'blocked',
     'travel_going', 'Model Town', 10, 'Model Town', now());

  BEGIN
    v_extra := public.derive_slot_promo_for_booking(
      '2030-01-15'::date, '14:00', 'Wapda Town', '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 5 failed: a blocked tile for another area must be rejected';
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9005 AND slot_start = '14:00';

  RAISE NOTICE 'test 5 passed: blocked tile for another area rejected';
END $$;


-- ---------------------------------------------------------------------------
-- Test 6 — call the RPC itself with a forged promo: the stored extra carries
-- the published tile value, not the caller's 100.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_booking_id uuid;
  v_stored     jsonb;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, promo_percent, promo_area, synced_at)
  VALUES
    ('2030-01-15', 9006, 'Review Car', '14:00', '14:30', 'blocked',
     'travel_returning', 'Wapda Town', 10, 'Wapda Town', now());

  v_booking_id := public.submit_slot_booking_with_metadata(
    'Review Customer', '03001234567', '2030-01-15'::date, '14:00',
    NULL, 0, false, NULL, 'Wapda Town',
    '{"promo_requested": 100}'::jsonb
  );

  SELECT extra INTO v_stored
    FROM public.booking_requests
   WHERE id = v_booking_id;

  IF v_stored ->> 'promo_requested' IS DISTINCT FROM '10' THEN
    RAISE EXCEPTION 'test 6 failed: RPC must store the published promo 10, got %', v_stored;
  END IF;

  DELETE FROM public.booking_requests WHERE id = v_booking_id;
  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9006 AND slot_start = '14:00';

  RAISE NOTICE 'test 6 passed: RPC ignores forged promo and stores the published 10';
END $$;
