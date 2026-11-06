-- =============================================================================
-- Migration 010 — REVIEW TESTS (run manually after 009_rpc_promo_hardening.sql)
--
-- Proves that an `advance_booked` tile is rejected for ANY area — the block
-- is keyed on block_reason only, so no p_area value can make it bookable.
--
-- Each block is self-contained: it inserts its own fixture row and deletes it
-- at the end. Safe to re-run against the same database.
--
-- Fixtures use 2030-01-15 and vehicle_id 9007 so they never collide with real
-- data or with the 009 review fixtures (9001-9006).
--
-- slot_availability required columns: vehicle_id, slot_date (TEXT), slot_start,
-- slot_end, status. Unique key: (slot_date, vehicle_id, slot_start).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Test 1 — derive_slot_promo_for_booking rejects an advance_booked tile for a
-- matching area, a different area, and no area at all.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra   jsonb;
  v_failed  boolean;
  v_areas   text[] := ARRAY['Wapda Town', 'Model Town', NULL];
  v_i       int;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, available_in_days, synced_at)
  VALUES
    ('2030-01-15', 9007, 'Review Car', '14:00', '14:30', 'blocked',
     'advance_booked', 'Wapda Town', 3, now());

  FOR v_i IN 1 .. array_length(v_areas, 1) LOOP
    v_failed := false;
    BEGIN
      v_extra := public.derive_slot_promo_for_booking(
        '2030-01-15'::date, '14:00', v_areas[v_i], '{}'::jsonb
      );
    EXCEPTION WHEN OTHERS THEN
      v_failed := true;
    END;

    IF NOT v_failed THEN
      RAISE EXCEPTION 'test 1 failed: advance_booked must be rejected for area %', v_areas[v_i];
    END IF;
  END LOOP;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9007 AND slot_start = '14:00';

  RAISE NOTICE 'test 1 passed: advance_booked rejected for every area (%, %, NULL)', v_areas[1], v_areas[2];
END $$;


-- ---------------------------------------------------------------------------
-- Test 2 — submit_slot_booking_with_metadata refuses the advance_booked tile
-- and creates NO booking_requests row.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_booking_id uuid;
  v_failed     boolean := false;
  v_count      int;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status,
     block_reason, area, available_in_days, synced_at)
  VALUES
    ('2030-01-15', 9007, 'Review Car', '14:00', '14:30', 'blocked',
     'advance_booked', 'Wapda Town', 3, now());

  BEGIN
    v_booking_id := public.submit_slot_booking_with_metadata(
      'Review Customer', '03001234567', '2030-01-15'::date, '14:00',
      NULL, 0, false, NULL, 'Wapda Town', '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
    v_booking_id := NULL;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 2 failed: RPC must reject an advance_booked tile';
  END IF;

  SELECT count(*) INTO v_count
    FROM public.booking_requests
   WHERE id = v_booking_id;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'test 2 failed: a booking row was created for an advance_booked tile';
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9007 AND slot_start = '14:00';

  RAISE NOTICE 'test 2 passed: RPC rejected advance_booked and stored no booking';
END $$;


-- ---------------------------------------------------------------------------
-- Test 3 — a normal available tile at the same date/time is still bookable
-- (guards against an over-broad rejection).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_extra jsonb;
BEGIN
  INSERT INTO public.slot_availability
    (slot_date, vehicle_id, vehicle_name, slot_start, slot_end, status, synced_at)
  VALUES
    ('2030-01-15', 9007, 'Review Car', '15:00', '15:30', 'available', now());

  v_extra := public.derive_slot_promo_for_booking(
    '2030-01-15'::date, '15:00', NULL, '{}'::jsonb
  );

  IF v_extra IS NULL THEN
    RAISE EXCEPTION 'test 3 failed: an available tile must remain bookable';
  END IF;

  DELETE FROM public.slot_availability
   WHERE slot_date = '2030-01-15' AND vehicle_id = 9007 AND slot_start = '15:00';

  RAISE NOTICE 'test 3 passed: available tile at the same date is still bookable';
END $$;
