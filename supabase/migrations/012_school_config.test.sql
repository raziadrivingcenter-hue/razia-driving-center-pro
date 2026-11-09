-- =============================================================================
-- Migration 012 — REVIEW TESTS (run manually after 012_school_config.sql)
--
-- Proves:
--   1.  the seed row carries Razia's current values
--   2.  the JSONB validators reject a malformed course / vehicle / method /
--       closed-date / object field
--   3.  update_school_config applies a PARTIAL patch and bumps the version
--   4.  optimistic concurrency refuses a stale version and writes nothing
--   5.  every accepted update snapshots the new version into history
--   6.  booking_requests.config_version is stamped on insert, and an explicit
--       value is never overwritten
--   7.  the public view exposes the whitelisted columns only
--   8.  anon can read NO rows from the private table and cannot call
--       update_school_config
--   9.  school_config_history is append-only — even service_role can neither
--       UPDATE nor DELETE a snapshot
--  10.  with no school_config row, config_version is NULL (legacy semantics).
--       This MUST stay last: it deletes the config row.
--
-- The WHOLE FILE runs inside one transaction that is ROLLED BACK at the end, so
-- it is safe to re-run against a live project: nothing it writes persists.
--
-- It reads the CURRENT config version at the start rather than assuming 1, so it
-- also works on a project whose config has already been edited.
--
-- Requires migration 012 to have been applied first (the seed row must exist).
-- =============================================================================

BEGIN;

-- Scratch values shared between the DO blocks below.
CREATE TEMP TABLE _cfg_test (
  start_version integer,
  after_version integer
);

INSERT INTO _cfg_test (start_version)
SELECT version FROM public.school_config WHERE id = 1;

-- ---------------------------------------------------------------------------
-- Test 1 — seed row
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v school_config;
  v_start integer;
BEGIN
  SELECT start_version INTO v_start FROM _cfg_test;
  SELECT * INTO v FROM public.school_config WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'test 1 failed: school_config has no row id = 1 — run migration 012 first';
  END IF;
  IF v.version IS DISTINCT FROM v_start THEN
    RAISE EXCEPTION 'test 1 failed: version changed mid-test (%)', v.version;
  END IF;
  IF v.school_name <> 'Razia Driving Center' THEN
    RAISE EXCEPTION 'test 1 failed: school_name is %', v.school_name;
  END IF;
  IF v.rate_per_km <> 50 OR v.service_radius_km <> 20 OR v.max_distance_km <> 20 THEN
    RAISE EXCEPTION 'test 1 failed: rates/radius not seeded correctly';
  END IF;
  IF v.currency <> 'PKR' OR v.timezone <> 'Asia/Karachi' OR v.locale <> 'en-PK' THEN
    RAISE EXCEPTION 'test 1 failed: locale block not seeded correctly';
  END IF;
  IF jsonb_array_length(v.courses) <> 3 THEN
    RAISE EXCEPTION 'test 1 failed: expected 3 courses, found %', jsonb_array_length(v.courses);
  END IF;

  RAISE NOTICE 'test 1 passed: seed row present with Razia''s values (version %)', v_start;
END $$;

-- ---------------------------------------------------------------------------
-- Test 2 — validators reject malformed shapes
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_bad     jsonb;
  v_failed  boolean;
  v_start   integer;
  v_cases   text[] := ARRAY[
    'courses not array|{"courses": {}}',
    'empty courses|{"courses": []}',
    'course price missing|{"courses": [{"id":"x","name":"X","days":7,"minutes_per_day":30,"free_pickup_km":0,"active":true}]}',
    'course price negative|{"courses": [{"id":"x","name":"X","price":-1,"days":7,"minutes_per_day":30,"free_pickup_km":0,"active":true}]}',
    'course days zero|{"courses": [{"id":"x","name":"X","price":1,"days":0,"minutes_per_day":30,"free_pickup_km":0,"active":true}]}',
    'course active not boolean|{"courses": [{"id":"x","name":"X","price":1,"days":7,"minutes_per_day":30,"free_pickup_km":0,"active":"yes"}]}',
    'vehicle name missing|{"vehicles": [{"id":"v1","active":true}]}',
    'bad payment method|{"enabled_payment_methods": ["card","bitcoin"]}',
    'bad closed date|{"closed_dates": ["15-01-2030"]}',
    'social_links not object|{"social_links": []}',
    'policy not object|{"policy": "text"}'
  ];
  v_i     int;
  v_label text;
BEGIN
  SELECT start_version INTO v_start FROM _cfg_test;

  FOR v_i IN 1 .. array_length(v_cases, 1) LOOP
    v_label := split_part(v_cases[v_i], '|', 1);
    v_bad   := split_part(v_cases[v_i], '|', 2)::jsonb;
    v_failed := false;

    BEGIN
      PERFORM public.update_school_config(v_start, v_bad);
    EXCEPTION WHEN OTHERS THEN
      v_failed := true;
    END;

    IF NOT v_failed THEN
      RAISE EXCEPTION 'test 2 failed: % was accepted but must be rejected', v_label;
    END IF;
  END LOOP;

  RAISE NOTICE 'test 2 passed: all % malformed shapes rejected', array_length(v_cases, 1);
END $$;

-- ---------------------------------------------------------------------------
-- Test 3 — partial patch applies, version bumps, other fields untouched
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_new     integer;
  v_start   integer;
  v         school_config;
BEGIN
  SELECT start_version INTO v_start FROM _cfg_test;

  v_new := public.update_school_config(v_start, '{"rate_per_km": 60, "city": "Lahore Cantonment"}');

  IF v_new <> v_start + 1 THEN
    RAISE EXCEPTION 'test 3 failed: expected version %, got %', v_start + 1, v_new;
  END IF;

  UPDATE _cfg_test SET after_version = v_new;

  SELECT * INTO v FROM public.school_config WHERE id = 1;
  IF v.rate_per_km <> 60 THEN
    RAISE EXCEPTION 'test 3 failed: rate_per_km not applied';
  END IF;
  IF v.city <> 'Lahore Cantonment' THEN
    RAISE EXCEPTION 'test 3 failed: city not applied';
  END IF;
  IF v.school_name <> 'Razia Driving Center' OR v.service_radius_km <> 20 THEN
    RAISE EXCEPTION 'test 3 failed: a field absent from the patch was changed';
  END IF;

  RAISE NOTICE 'test 3 passed: partial patch applied, version % -> %', v_start, v_new;
END $$;

-- ---------------------------------------------------------------------------
-- Test 4 — optimistic concurrency: stale version refuses, writes nothing
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_failed  boolean;
  v_start   integer;
  v_after   integer;
  v         school_config;
BEGIN
  SELECT start_version, after_version INTO v_start, v_after FROM _cfg_test;

  v_failed := false;
  BEGIN
    PERFORM public.update_school_config(v_start, '{"rate_per_km": 999}');
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 4 failed: a stale version was accepted';
  END IF;

  SELECT * INTO v FROM public.school_config WHERE id = 1;
  IF v.version <> v_after OR v.rate_per_km <> 60 THEN
    RAISE EXCEPTION 'test 4 failed: the refused update still changed the row';
  END IF;

  RAISE NOTICE 'test 4 passed: stale version refused, row unchanged';
END $$;

-- ---------------------------------------------------------------------------
-- Test 5 — history snapshot per version
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_after    integer;
  v_count    int;
  v_snapshot jsonb;
BEGIN
  SELECT after_version INTO v_after FROM _cfg_test;

  SELECT count(*) INTO v_count FROM public.school_config_history;
  IF v_count < 1 THEN
    RAISE EXCEPTION 'test 5 failed: no history rows written';
  END IF;

  SELECT snapshot INTO v_snapshot
    FROM public.school_config_history
   WHERE config_version = v_after;

  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'test 5 failed: no snapshot for version %', v_after;
  END IF;
  IF (v_snapshot->>'rate_per_km')::numeric <> 60 THEN
    RAISE EXCEPTION 'test 5 failed: snapshot does not reflect the update';
  END IF;

  RAISE NOTICE 'test 5 passed: version % snapshot recorded', v_after;
END $$;

-- ---------------------------------------------------------------------------
-- Test 6 — booking_requests.config_version is stamped by the trigger
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_after     integer;
  v_id        uuid := '00000000-0000-4000-8000-000000000120';
  v_explicit  uuid := '00000000-0000-4000-8000-000000000121';
  v_stamped   int;
  v_kept      int;
BEGIN
  SELECT after_version INTO v_after FROM _cfg_test;

  INSERT INTO public.booking_requests (
    id, customer_name, customer_phone, preferred_date, preferred_time,
    preferred_course, status, source, message, distance_km, home_service
  ) VALUES (
    v_id, 'Config Test', '+923000000000', '2030-01-15', '14:00',
    'Basic Plan', 'pending', 'config-test', 'stamped', 0, false
  );

  SELECT config_version INTO v_stamped FROM public.booking_requests WHERE id = v_id;
  IF v_stamped IS DISTINCT FROM v_after THEN
    RAISE EXCEPTION 'test 6 failed: expected config_version %, found %', v_after, v_stamped;
  END IF;

  -- An explicit value must survive: the trigger only fills NULL.
  INSERT INTO public.booking_requests (
    id, customer_name, customer_phone, preferred_date, preferred_time,
    preferred_course, status, source, message, distance_km, home_service,
    config_version
  ) VALUES (
    v_explicit, 'Config Test 2', '+923000000001', '2030-01-15', '14:30',
    'Basic Plan', 'pending', 'config-test', 'explicit', 0, false,
    7
  );

  SELECT config_version INTO v_kept FROM public.booking_requests WHERE id = v_explicit;
  IF v_kept <> 7 THEN
    RAISE EXCEPTION 'test 6 failed: explicit config_version 7 was overwritten with %', v_kept;
  END IF;

  DELETE FROM public.booking_requests WHERE id IN (v_id, v_explicit);

  RAISE NOTICE 'test 6 passed: trigger stamps NULL, preserves explicit values';
END $$;

-- ---------------------------------------------------------------------------
-- Test 7 — public view column whitelist
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_cols text;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY column_name)
    INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'school_config_public';

  IF v_cols LIKE '%updated_by%' OR v_cols LIKE '%payment_provider%' THEN
    RAISE EXCEPTION 'test 7 failed: the public view exposes an internal column: %', v_cols;
  END IF;
  IF v_cols NOT LIKE '%school_name%' OR v_cols NOT LIKE '%courses%' THEN
    RAISE EXCEPTION 'test 7 failed: the public view is missing expected columns: %', v_cols;
  END IF;

  RAISE NOTICE 'test 7 passed: public view exposes only whitelisted columns';
END $$;

-- ---------------------------------------------------------------------------
-- Test 8 — anon cannot read the private table or call the write function
-- ---------------------------------------------------------------------------
-- Two separate denials are acceptable for the table read: zero rows (RLS with
-- no policy for anon) or a permission error (no SELECT privilege at all).
-- Either proves anon cannot see the private config.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_count  int;
  v_failed boolean;
BEGIN
  SET LOCAL ROLE anon;

  BEGIN
    SELECT count(*) INTO v_count FROM public.school_config;
  EXCEPTION WHEN insufficient_privilege THEN
    v_count := 0;
  END;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'test 8 failed: anon read % school_config row(s)', v_count;
  END IF;

  v_failed := false;
  BEGIN
    PERFORM public.update_school_config(1, '{}'::jsonb);
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 8 failed: anon could call update_school_config';
  END IF;

  SET LOCAL ROLE NONE;

  RAISE NOTICE 'test 8 passed: anon reads no config rows and cannot write';
END $$;

-- ---------------------------------------------------------------------------
-- Test 9 — history is append-only, even for service_role
-- ---------------------------------------------------------------------------
-- The revoke is only meaningful for a non-superuser, so the probe must run as
-- service_role. Running it as the SQL Editor's postgres role would prove
-- nothing, because superusers ignore REVOKE.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_id     bigint;
  v_failed boolean;
BEGIN
  SELECT id INTO v_id
    FROM public.school_config_history
   ORDER BY id DESC
   LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'test 9 failed: no history row to probe';
  END IF;

  SET LOCAL ROLE service_role;

  v_failed := false;
  BEGIN
    UPDATE public.school_config_history
       SET snapshot = '{}'::jsonb
     WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 9 failed: service_role could UPDATE a history snapshot';
  END IF;

  v_failed := false;
  BEGIN
    DELETE FROM public.school_config_history WHERE id = v_id;
  EXCEPTION WHEN OTHERS THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'test 9 failed: service_role could DELETE a history snapshot';
  END IF;

  SET LOCAL ROLE NONE;

  RAISE NOTICE 'test 9 passed: history is append-only (UPDATE/DELETE revoked)';
END $$;

-- ---------------------------------------------------------------------------
-- Test 10 — no config row means config_version is NULL (legacy semantics)
-- ---------------------------------------------------------------------------
-- MUST BE LAST: it deletes the school_config row. The whole file is wrapped in
-- BEGIN/ROLLBACK, so the delete is undone when the transaction rolls back.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_id   uuid := '00000000-0000-4000-8000-000000000122';
  v_stamp integer;
BEGIN
  DELETE FROM public.school_config WHERE id = 1;

  INSERT INTO public.booking_requests (
    id, customer_name, customer_phone, preferred_date, preferred_time,
    preferred_course, status, source, message, distance_km, home_service
  ) VALUES (
    v_id, 'Legacy Test', '+923000000002', '2030-01-15', '15:00',
    'Basic Plan', 'pending', 'config-test', 'legacy', 0, false
  );

  SELECT config_version INTO v_stamp
    FROM public.booking_requests WHERE id = v_id;

  IF v_stamp IS NOT NULL THEN
    RAISE EXCEPTION 'test 10 failed: expected NULL config_version with no config row, found %', v_stamp;
  END IF;

  DELETE FROM public.booking_requests WHERE id = v_id;

  RAISE NOTICE 'test 10 passed: no config row -> config_version is NULL (legacy)';
END $$;

ROLLBACK;

-- =============================================================================
-- SUMMARY — yeh query ROLLBACK ke BAAD chalti hai.
--
-- Har test fail hone par RAISE EXCEPTION karta hai. Exception poore transaction
-- ko rook leta hai, is liye script aakhir tak pohnchti hi nahi — aur yeh query
-- bhi chalti hi nahi.
--
-- Yani, Supabase SQL Editor me:
--   * Agar neeche RESULTS GRID me yeh row dikh rahi hai
--       = koi test fail nahi hua  →  PASS ✅
--   * Agar "Failed to run SQL query: ERROR: test N failed: ..." dikha
--       = wahi test fail hua  →  FAIL ❌ (mujhe text dein)
--
-- Saath hi DB ka end-state bhi dikh gaya hai. Test ke baad DB bilkul waisa hi
-- hona chahiye jaisa test se pehle tha (matlab rollback ne kuch chhua nahi).
--
-- Expected (throwaway project jisme sirf 012 lagi hai):
--   config_rows=1, version=1, history_rows=0, booking_rows=0, policies=0
-- =============================================================================
SELECT
  (SELECT count(*) FROM public.school_config)                          AS config_rows,
  (SELECT version FROM public.school_config WHERE id = 1)             AS version,
  (SELECT count(*) FROM public.school_config_history)                  AS history_rows,
  (SELECT count(*) FROM public.booking_requests)                       AS booking_rows,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'school_config') AS policies,
  'PASS — koi test fail nahi hua, DB waisa hi hai'                    AS result;

-- =============================================================================
-- EXPECTED OUTPUT: ten "passed" notices in the Messages tab, then ROLLBACK,
-- then the SUMMARY row above in the Results grid. If any test fails it raises
-- and the whole transaction is discarded — the database is unchanged, and the
-- SUMMARY query never runs.
--
-- HOW TO READ PASS/FAIL IN THE SUPABASE SQL EDITOR
--   * Success: Results grid me SUMMARY row dikhti hai (config_rows=1, ...,
--     result='PASS ...'). Messages tab me das "test N passed:" lines bhi hain.
--   * Failure: query ruk jati hai, "ERROR: test N failed: ..." dikhta hai, aur
--     SUMMARY row kyun nahi chali wahi pata chalta hai. Poora file dobara chalayein.
--   * Messages tab na mile to RESULTS GRID ka SUMMARY row kaafi hai.
-- =============================================================================
