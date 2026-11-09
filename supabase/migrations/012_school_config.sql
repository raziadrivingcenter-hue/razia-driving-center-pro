-- =============================================================================
-- Migration 012 — per-school configuration
--
-- One row (id = 1) holds every school-specific value the website and the SOD
-- desktop app need: brand, contact, locale, map centre, service radius, rates,
-- schedule, course catalogue, payment methods, policy text and comms templates.
--
-- Design rules:
--   * NOTHING secret lives here. Gateway keys, webhook secrets, the ORS key and
--     the Supabase service-role key stay in server environment variables only.
--     The desktop Settings screen reads a status endpoint; it never writes or
--     displays them.
--   * `school_config_public` is a view with an explicit column whitelist, so
--     anon can read the public fields and nothing else. The view runs with its
--     owner's rights (the default), so anon needs — and gets — no privilege on
--     the underlying table.
--   * Updates are optimistic-concurrency: the caller passes the version it read,
--     and the update refuses to apply if the row has moved on.
--   * Every version is snapshotted into `school_config_history`, which is
--     append-only (UPDATE/DELETE revoked, even from service_role).
--   * `booking_requests.config_version` is stamped by a BEFORE INSERT trigger,
--     so both the card path and the untouched submit_slot_booking path record
--     which config version priced the booking. NULL means "legacy row".
--
-- Wrapped in BEGIN/COMMIT: if any statement fails, nothing is applied.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. schema_migrations — the only record of what has been applied
-- -----------------------------------------------------------------------------
-- There is no migration framework in this project: SQL files are applied by
-- hand per school project. This table lets the desktop Settings screen report
-- "database is at version N / migration M is missing" instead of discovering a
-- missing column at runtime as a PostgREST PGRST204 error.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version     text        PRIMARY KEY,
  description text        NOT NULL DEFAULT '',
  applied_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
-- No grants: service_role only.

-- -----------------------------------------------------------------------------
-- 1b. Backfill — record migrations that predate this registry
-- -----------------------------------------------------------------------------
-- Existing school projects were built by hand in the SQL Editor, so 001-011
-- were applied long before schema_migrations existed. Without a backfill the
-- desktop would compare an empty registry against the version the running code
-- expects and report every existing school as "behind".
--
-- Each version is registered only when an object it introduced still exists.
-- The probe runs NEWEST -> OLDEST and keeps the highest hit: because every
-- migration builds on the previous one, proving 009 proves 001-008 as well.
--
-- 010 is deliberately absent: there is no 010 migration file, only
-- 010_advance_booked_rejection.test.sql, which is a review test run after 009.
--
-- The desktop compares MAX(version) with the version the running code expects.
-- A gap below the maximum is informational, not "behind".
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_proven integer := 0;
BEGIN
  SELECT coalesce(max(version), 0) INTO v_proven
    FROM (VALUES
      (11, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'create_card_booking')),
      ( 9, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'derive_slot_promo_for_booking')),
      ( 8, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'submit_slot_booking_with_metadata_verified')),
      ( 7, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'get_my_progress')),
      ( 6, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'resolve_portal_student')),
      ( 5, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'submit_slot_booking'
                      AND p.pronargs >= 9)),
      ( 4, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'submit_slot_booking'
                      AND p.pronargs >= 8)),
      ( 3, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'submit_slot_booking')),
      ( 2, EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = 'public' AND p.proname = 'submit_booking')),
      ( 1, to_regclass('public.slots') IS NOT NULL
       AND to_regclass('public.bookings') IS NOT NULL)
    ) AS probes(version, applied)
   WHERE applied;

  IF v_proven >= 1 THEN
    INSERT INTO public.schema_migrations (version, description)
    SELECT v,
           'applied before schema_migrations existed; presence confirmed by migration 012'
      FROM generate_series(1, v_proven) AS v
     WHERE v <> 10
     ON CONFLICT (version) DO NOTHING;
  END IF;

  RAISE NOTICE 'schema_migrations backfill: highest migration proven applied is % (010 has no migration file)',
    v_proven;
END $$;

-- -----------------------------------------------------------------------------
-- 2. school_config
-- -----------------------------------------------------------------------------
-- Numeric money/distance values are double precision rather than numeric(x,y):
-- the consumers are JavaScript, where PostgREST renders `numeric` as a STRING
-- and every arithmetic site then needs a Number() conversion. These are config
-- values, not ledger amounts — the payment ledger (booking_requests) stays
-- numeric(10,2).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_config (
  id integer PRIMARY KEY DEFAULT 1,

  -- Brand ---------------------------------------------------------
  school_name            text   NOT NULL DEFAULT '',
  logo_url               text   NOT NULL DEFAULT '',
  site_url               text   NOT NULL DEFAULT '',
  brand_color            text   NOT NULL DEFAULT '#FF6201',
  brand_color_secondary  text   NOT NULL DEFAULT '#FF3131',

  -- Contact -------------------------------------------------------
  phone                  text   NOT NULL DEFAULT '',
  whatsapp               text   NOT NULL DEFAULT '',
  email                  text   NOT NULL DEFAULT '',
  address                text   NOT NULL DEFAULT '',
  city                   text   NOT NULL DEFAULT '',
  country                text   NOT NULL DEFAULT '',
  postal_code            text   NOT NULL DEFAULT '',
  social_links           jsonb  NOT NULL DEFAULT '{}'::jsonb,
  google_review_link     text   NOT NULL DEFAULT '',

  -- Locale -------------------------------------------------------
  currency               text   NOT NULL DEFAULT 'PKR',
  locale                 text   NOT NULL DEFAULT 'en-PK',
  timezone               text   NOT NULL DEFAULT 'Asia/Karachi',
  language               text   NOT NULL DEFAULT 'en',
  rtl                    boolean NOT NULL DEFAULT false,

  -- Map / service area -------------------------------------------
  base_lat               double precision NOT NULL DEFAULT 0,
  base_lng               double precision NOT NULL DEFAULT 0,
  service_radius_km      double precision NOT NULL DEFAULT 20,
  max_distance_km        double precision NOT NULL DEFAULT 20,
  map_style_url          text   NOT NULL DEFAULT '',

  -- Pricing ------------------------------------------------------
  rate_per_km            double precision NOT NULL DEFAULT 50,
  round_trip_multiplier  double precision NOT NULL DEFAULT 2,
  min_charge             double precision NOT NULL DEFAULT 0,
  rounding_rule          text   NOT NULL DEFAULT 'nearest_1',
  hold_minutes           integer NOT NULL DEFAULT 15,

  -- Schedule -----------------------------------------------------
  slot_duration_min      integer NOT NULL DEFAULT 30,
  operating_start        text   NOT NULL DEFAULT '07:00',
  operating_end          text   NOT NULL DEFAULT '19:00',
  last_slot_start        text   NOT NULL DEFAULT '18:30',
  closed_dates           jsonb  NOT NULL DEFAULT '[]'::jsonb,

  -- Catalogue ----------------------------------------------------
  -- courses:  [{ id, name, price, days, minutes_per_day, free_pickup_km, active }]
  -- vehicles: [{ id, name, active }]  — display only; live availability is
  --           still synced from the desktop into slot_availability.
  courses                jsonb  NOT NULL DEFAULT '[]'::jsonb,
  vehicles               jsonb  NOT NULL DEFAULT '[]'::jsonb,
  booking_id_prefix      text   NOT NULL DEFAULT '',

  -- Payments -----------------------------------------------------
  payment_enabled        boolean NOT NULL DEFAULT false,
  enabled_payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- 'none' means no gateway is wired up, so online card payment is disabled.
  -- This is the seeded default: a school opts in by choosing a real provider.
  payment_provider       text   NOT NULL DEFAULT 'none',

  -- Policy / comms -----------------------------------------------
  cancellation_window_hours integer NOT NULL DEFAULT 0,
  refund_window_hours       integer NOT NULL DEFAULT 0,
  policy                 jsonb  NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_template      text   NOT NULL DEFAULT '',

  -- Audit --------------------------------------------------------
  version                integer NOT NULL DEFAULT 1,
  updated_by             text,
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT school_config_single_row   CHECK (id = 1),
  CONSTRAINT school_config_version      CHECK (version >= 1),
  CONSTRAINT school_config_radius       CHECK (service_radius_km > 0),
  CONSTRAINT school_config_max_distance CHECK (max_distance_km > 0),
  CONSTRAINT school_config_rate         CHECK (rate_per_km >= 0),
  CONSTRAINT school_config_multiplier   CHECK (round_trip_multiplier >= 0),
  CONSTRAINT school_config_min_charge   CHECK (min_charge >= 0),
  CONSTRAINT school_config_hold         CHECK (hold_minutes > 0),
  CONSTRAINT school_config_slot_duration CHECK (slot_duration_min > 0),
  CONSTRAINT school_config_rounding     CHECK (
    rounding_rule IN ('none', 'nearest_1', 'nearest_10', 'nearest_100',
                      'ceil_1', 'floor_1')
  ),
  CONSTRAINT school_config_currency     CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT school_config_locale       CHECK (length(trim(locale)) > 0),
  CONSTRAINT school_config_timezone     CHECK (length(trim(timezone)) > 0),
  CONSTRAINT school_config_colors       CHECK (
    brand_color       ~ '^#[0-9A-Fa-f]{6}$' AND
    brand_color_secondary ~ '^#[0-9A-Fa-f]{6}$'
  )
);

COMMENT ON TABLE public.school_config IS
  'Single-row per-school configuration. No secrets: gateway keys, webhook secrets and API keys stay in server env vars.';

ALTER TABLE public.school_config ENABLE ROW LEVEL SECURITY;
-- No grants to anon/authenticated on the TABLE. Reads go through the view.

-- -----------------------------------------------------------------------------
-- 3. school_config_history — append-only version snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_config_history (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  config_version integer NOT NULL,
  snapshot      jsonb   NOT NULL,
  updated_by    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_config_history_version
  ON public.school_config_history (config_version DESC);

ALTER TABLE public.school_config_history ENABLE ROW LEVEL SECURITY;

-- Append-only: even service_role may not rewrite history. The update function
-- is SECURITY DEFINER (owned by postgres), so it can still INSERT.
REVOKE UPDATE, DELETE ON public.school_config_history
  FROM PUBLIC, anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. school_config_public — the whitelisted public view
-- -----------------------------------------------------------------------------
-- The view runs with its OWNER's rights (the default). That is deliberate: the
-- view's SELECT list IS the access control — it exposes the whitelisted columns
-- and nothing else. anon gets no privilege on the underlying table, so a direct
-- `select * from school_config` returns nothing.
--
-- A security_invoker view would have needed an RLS policy on the table to
-- authorise anon's read — and that same policy would also have let anon read
-- every column of the table directly, including payment_provider and
-- updated_by. That is exactly the hole test 8 catches.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.school_config_public
AS
SELECT
  school_name, logo_url, site_url, brand_color, brand_color_secondary,
  phone, whatsapp, email, address, city, country, postal_code,
  social_links, google_review_link,
  currency, locale, timezone, language, rtl,
  base_lat, base_lng, service_radius_km, max_distance_km, map_style_url,
  rate_per_km, round_trip_multiplier, min_charge, rounding_rule, hold_minutes,
  slot_duration_min, operating_start, operating_end, last_slot_start, closed_dates,
  courses, vehicles, booking_id_prefix,
  payment_enabled, enabled_payment_methods,
  cancellation_window_hours, refund_window_hours,
  policy, whatsapp_template,
  version, updated_at
FROM public.school_config;

-- Deliberately NOT exposed: id, payment_provider (which gateway is wired up),
-- updated_by, and anything else that is not part of the public site.

GRANT SELECT ON public.school_config_public TO anon, authenticated;

-- anon/authenticated get NO privilege on the table itself. Supabase's default
-- privileges would otherwise grant them access, so revoke it explicitly.
REVOKE ALL ON public.school_config FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Validation trigger — the JSONB shapes are enforced in the database
-- -----------------------------------------------------------------------------
-- CHECK constraints cannot contain subqueries, so array-of-object shapes are
-- validated here. This runs on INSERT and UPDATE, which means the seed row and
-- every update_school_config() call are both covered.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.school_config_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c jsonb;
  v jsonb;
  d text;
  m text;
BEGIN
  -- ---- courses ------------------------------------------------------------
  IF jsonb_typeof(NEW.courses) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'school_config.courses must be a JSON array';
  END IF;
  IF jsonb_array_length(NEW.courses) = 0 THEN
    RAISE EXCEPTION 'school_config.courses must contain at least one course';
  END IF;
  FOR c IN SELECT * FROM jsonb_array_elements(NEW.courses) LOOP
    IF jsonb_typeof(c) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'school_config.courses[] entries must be objects';
    END IF;
    IF jsonb_typeof(c->'id') IS DISTINCT FROM 'string'
       AND jsonb_typeof(c->'id') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config course id is required';
    END IF;
    IF coalesce(trim(c->>'id'), '') = '' THEN
      RAISE EXCEPTION 'school_config course id must not be empty';
    END IF;
    IF jsonb_typeof(c->'name') IS DISTINCT FROM 'string'
       OR length(trim(c->>'name')) = 0 THEN
      RAISE EXCEPTION 'school_config course "%": name is required', c->>'id';
    END IF;
    IF jsonb_typeof(c->'price') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config course "%": price must be a number', c->>'id';
    END IF;
    IF (c->>'price')::numeric < 0 THEN
      RAISE EXCEPTION 'school_config course "%": price must be >= 0', c->>'id';
    END IF;
    IF jsonb_typeof(c->'days') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config course "%": days must be a number', c->>'id';
    END IF;
    IF (c->>'days')::numeric <= 0 THEN
      RAISE EXCEPTION 'school_config course "%": days must be > 0', c->>'id';
    END IF;
    IF jsonb_typeof(c->'minutes_per_day') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config course "%": minutes_per_day must be a number', c->>'id';
    END IF;
    IF (c->>'minutes_per_day')::numeric <= 0 THEN
      RAISE EXCEPTION 'school_config course "%": minutes_per_day must be > 0', c->>'id';
    END IF;
    IF jsonb_typeof(c->'free_pickup_km') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config course "%": free_pickup_km must be a number', c->>'id';
    END IF;
    IF (c->>'free_pickup_km')::numeric < 0 THEN
      RAISE EXCEPTION 'school_config course "%": free_pickup_km must be >= 0', c->>'id';
    END IF;
    IF jsonb_typeof(c->'active') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'school_config course "%": active must be a boolean', c->>'id';
    END IF;
  END LOOP;

  -- ---- vehicles ----------------------------------------------------------
  IF jsonb_typeof(NEW.vehicles) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'school_config.vehicles must be a JSON array';
  END IF;
  FOR v IN SELECT * FROM jsonb_array_elements(NEW.vehicles) LOOP
    IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'school_config.vehicles[] entries must be objects';
    END IF;
    IF jsonb_typeof(v->'id') IS DISTINCT FROM 'string'
       AND jsonb_typeof(v->'id') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'school_config vehicle id is required';
    END IF;
    IF coalesce(trim(v->>'id'), '') = '' THEN
      RAISE EXCEPTION 'school_config vehicle id must not be empty';
    END IF;
    IF jsonb_typeof(v->'name') IS DISTINCT FROM 'string'
       OR length(trim(v->>'name')) = 0 THEN
      RAISE EXCEPTION 'school_config vehicle "%": name is required', v->>'id';
    END IF;
    IF jsonb_typeof(v->'active') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'school_config vehicle "%": active must be a boolean', v->>'id';
    END IF;
  END LOOP;

  -- ---- enabled_payment_methods ------------------------------------------
  IF jsonb_typeof(NEW.enabled_payment_methods) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'school_config.enabled_payment_methods must be a JSON array';
  END IF;
  FOR m IN SELECT * FROM jsonb_array_elements_text(NEW.enabled_payment_methods) LOOP
    IF m NOT IN ('card', 'cash', 'bank', 'jazzcash', 'easypaisa') THEN
      RAISE EXCEPTION 'school_config.enabled_payment_methods: unsupported method "%"', m;
    END IF;
  END LOOP;

  -- ---- closed_dates ------------------------------------------------------
  IF jsonb_typeof(NEW.closed_dates) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'school_config.closed_dates must be a JSON array';
  END IF;
  FOR d IN SELECT * FROM jsonb_array_elements_text(NEW.closed_dates) LOOP
    IF d !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      RAISE EXCEPTION 'school_config.closed_dates: "%" is not a YYYY-MM-DD date', d;
    END IF;
  END LOOP;

  -- ---- objects -----------------------------------------------------------
  IF jsonb_typeof(NEW.social_links) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'school_config.social_links must be a JSON object';
  END IF;
  IF jsonb_typeof(NEW.policy) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'school_config.policy must be a JSON object';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER school_config_validate
  BEFORE INSERT OR UPDATE ON public.school_config
  FOR EACH ROW EXECUTE FUNCTION public.school_config_validate();

-- -----------------------------------------------------------------------------
-- 6. update_school_config — the single write path
-- -----------------------------------------------------------------------------
-- Optimistic concurrency: the caller passes the version it read. If the row
-- has moved on, the update raises and nothing is written. On success the new
-- version is snapshotted into school_config_history.
--
-- p_patch is a JSON object; keys absent from it are left unchanged, so a
-- partial edit never zeroes a field. Unknown keys are ignored.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_school_config(
  p_expected_version integer,
  p_patch            jsonb,
  p_updated_by       text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
  v_new     integer;
BEGIN
  IF p_patch IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'school_config update: patch must be a JSON object';
  END IF;

  SELECT version INTO v_current
    FROM public.school_config
   WHERE id = 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'school_config is not initialised';
  END IF;

  IF v_current IS DISTINCT FROM p_expected_version THEN
    RAISE EXCEPTION 'school_config version conflict: expected %, found %',
      p_expected_version, v_current;
  END IF;

  UPDATE public.school_config s
     SET school_name = CASE WHEN p_patch ? 'school_name'
                            THEN p_patch->>'school_name' ELSE s.school_name END,
         logo_url = CASE WHEN p_patch ? 'logo_url'
                            THEN p_patch->>'logo_url' ELSE s.logo_url END,
         site_url = CASE WHEN p_patch ? 'site_url'
                            THEN p_patch->>'site_url' ELSE s.site_url END,
         brand_color = CASE WHEN p_patch ? 'brand_color'
                            THEN p_patch->>'brand_color' ELSE s.brand_color END,
         brand_color_secondary = CASE WHEN p_patch ? 'brand_color_secondary'
                            THEN p_patch->>'brand_color_secondary' ELSE s.brand_color_secondary END,
         phone = CASE WHEN p_patch ? 'phone'
                            THEN p_patch->>'phone' ELSE s.phone END,
         whatsapp = CASE WHEN p_patch ? 'whatsapp'
                            THEN p_patch->>'whatsapp' ELSE s.whatsapp END,
         email = CASE WHEN p_patch ? 'email'
                            THEN p_patch->>'email' ELSE s.email END,
         address = CASE WHEN p_patch ? 'address'
                            THEN p_patch->>'address' ELSE s.address END,
         city = CASE WHEN p_patch ? 'city'
                            THEN p_patch->>'city' ELSE s.city END,
         country = CASE WHEN p_patch ? 'country'
                            THEN p_patch->>'country' ELSE s.country END,
         postal_code = CASE WHEN p_patch ? 'postal_code'
                            THEN p_patch->>'postal_code' ELSE s.postal_code END,
         social_links = CASE WHEN p_patch ? 'social_links'
                            THEN p_patch->'social_links' ELSE s.social_links END,
         google_review_link = CASE WHEN p_patch ? 'google_review_link'
                            THEN p_patch->>'google_review_link' ELSE s.google_review_link END,
         currency = CASE WHEN p_patch ? 'currency'
                            THEN p_patch->>'currency' ELSE s.currency END,
         locale = CASE WHEN p_patch ? 'locale'
                            THEN p_patch->>'locale' ELSE s.locale END,
         timezone = CASE WHEN p_patch ? 'timezone'
                            THEN p_patch->>'timezone' ELSE s.timezone END,
         language = CASE WHEN p_patch ? 'language'
                            THEN p_patch->>'language' ELSE s.language END,
         rtl = CASE WHEN p_patch ? 'rtl'
                            THEN (p_patch->>'rtl')::boolean ELSE s.rtl END,
         base_lat = CASE WHEN p_patch ? 'base_lat'
                            THEN (p_patch->>'base_lat')::double precision ELSE s.base_lat END,
         base_lng = CASE WHEN p_patch ? 'base_lng'
                            THEN (p_patch->>'base_lng')::double precision ELSE s.base_lng END,
         service_radius_km = CASE WHEN p_patch ? 'service_radius_km'
                            THEN (p_patch->>'service_radius_km')::double precision ELSE s.service_radius_km END,
         max_distance_km = CASE WHEN p_patch ? 'max_distance_km'
                            THEN (p_patch->>'max_distance_km')::double precision ELSE s.max_distance_km END,
         map_style_url = CASE WHEN p_patch ? 'map_style_url'
                            THEN p_patch->>'map_style_url' ELSE s.map_style_url END,
         rate_per_km = CASE WHEN p_patch ? 'rate_per_km'
                            THEN (p_patch->>'rate_per_km')::double precision ELSE s.rate_per_km END,
         round_trip_multiplier = CASE WHEN p_patch ? 'round_trip_multiplier'
                            THEN (p_patch->>'round_trip_multiplier')::double precision ELSE s.round_trip_multiplier END,
         min_charge = CASE WHEN p_patch ? 'min_charge'
                            THEN (p_patch->>'min_charge')::double precision ELSE s.min_charge END,
         rounding_rule = CASE WHEN p_patch ? 'rounding_rule'
                            THEN p_patch->>'rounding_rule' ELSE s.rounding_rule END,
         hold_minutes = CASE WHEN p_patch ? 'hold_minutes'
                            THEN (p_patch->>'hold_minutes')::integer ELSE s.hold_minutes END,
         slot_duration_min = CASE WHEN p_patch ? 'slot_duration_min'
                            THEN (p_patch->>'slot_duration_min')::integer ELSE s.slot_duration_min END,
         operating_start = CASE WHEN p_patch ? 'operating_start'
                            THEN p_patch->>'operating_start' ELSE s.operating_start END,
         operating_end = CASE WHEN p_patch ? 'operating_end'
                            THEN p_patch->>'operating_end' ELSE s.operating_end END,
         last_slot_start = CASE WHEN p_patch ? 'last_slot_start'
                            THEN p_patch->>'last_slot_start' ELSE s.last_slot_start END,
         closed_dates = CASE WHEN p_patch ? 'closed_dates'
                            THEN p_patch->'closed_dates' ELSE s.closed_dates END,
         courses = CASE WHEN p_patch ? 'courses'
                            THEN p_patch->'courses' ELSE s.courses END,
         vehicles = CASE WHEN p_patch ? 'vehicles'
                            THEN p_patch->'vehicles' ELSE s.vehicles END,
         booking_id_prefix = CASE WHEN p_patch ? 'booking_id_prefix'
                            THEN p_patch->>'booking_id_prefix' ELSE s.booking_id_prefix END,
         payment_enabled = CASE WHEN p_patch ? 'payment_enabled'
                            THEN (p_patch->>'payment_enabled')::boolean ELSE s.payment_enabled END,
         enabled_payment_methods = CASE WHEN p_patch ? 'enabled_payment_methods'
                            THEN p_patch->'enabled_payment_methods' ELSE s.enabled_payment_methods END,
         cancellation_window_hours = CASE WHEN p_patch ? 'cancellation_window_hours'
                            THEN (p_patch->>'cancellation_window_hours')::integer ELSE s.cancellation_window_hours END,
         refund_window_hours = CASE WHEN p_patch ? 'refund_window_hours'
                            THEN (p_patch->>'refund_window_hours')::integer ELSE s.refund_window_hours END,
         policy = CASE WHEN p_patch ? 'policy'
                            THEN p_patch->'policy' ELSE s.policy END,
         whatsapp_template = CASE WHEN p_patch ? 'whatsapp_template'
                            THEN p_patch->>'whatsapp_template' ELSE s.whatsapp_template END,
         version = s.version + 1,
         updated_by = coalesce(p_updated_by, s.updated_by),
         updated_at = now()
   WHERE s.id = 1;

  SELECT version INTO v_new FROM public.school_config WHERE id = 1;

  INSERT INTO public.school_config_history (config_version, snapshot, updated_by)
  SELECT s.version, to_jsonb(s), p_updated_by
    FROM public.school_config s
   WHERE s.id = 1;

  RETURN v_new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_school_config(integer, jsonb, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_school_config(integer, jsonb, text)
  TO service_role;

-- -----------------------------------------------------------------------------
-- 7. config_version on booking_requests
-- -----------------------------------------------------------------------------
-- Stamped by trigger on EVERY insert, so the card path (create_card_booking)
-- and the untouched submit_slot_booking path both record the config version
-- that priced the booking. NULL means the row predates migration 012.
-- -----------------------------------------------------------------------------
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS config_version integer;

COMMENT ON COLUMN public.booking_requests.config_version IS
  'school_config.version that priced this booking. NULL = legacy row, predates migration 012.';

CREATE OR REPLACE FUNCTION public.booking_requests_stamp_config_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version integer;
BEGIN
  IF NEW.config_version IS NULL THEN
    SELECT version INTO v_version
      FROM public.school_config
     WHERE id = 1;
    NEW.config_version := v_version;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_requests_stamp_config_version ON public.booking_requests;
CREATE TRIGGER booking_requests_stamp_config_version
  BEFORE INSERT ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.booking_requests_stamp_config_version();

-- -----------------------------------------------------------------------------
-- 8. Seed — Razia Driving Center's current values
-- -----------------------------------------------------------------------------
-- Every value below is copied from the code that is being replaced, so Razia's
-- prices, radius, schedule and catalogue do not change.
--
-- Placeholders left for the school to fill in from the desktop Settings screen:
-- policy text, google_review_link, social_links, logo_url, booking_id_prefix.
--
-- payment_provider is seeded to 'none' (card payments disabled). It records
-- which gateway the SERVER is wired to via the PAYMENT_PROVIDER env var; it is
-- deliberately not writable through update_school_config, because the gateway
-- choice and its credentials belong to the deployment, not to the school
-- operator. The desktop Settings screen shows it as "configured / not
-- configured" and never displays a key.
-- -----------------------------------------------------------------------------
INSERT INTO public.school_config (
  id, school_name, logo_url, site_url,
  brand_color, brand_color_secondary,
  phone, whatsapp, email, address, city, country, postal_code,
  social_links, google_review_link,
  currency, locale, timezone, language, rtl,
  base_lat, base_lng, service_radius_km, max_distance_km, map_style_url,
  rate_per_km, round_trip_multiplier, min_charge, rounding_rule, hold_minutes,
  slot_duration_min, operating_start, operating_end, last_slot_start, closed_dates,
  courses, vehicles, booking_id_prefix,
  payment_enabled, enabled_payment_methods, payment_provider,
  cancellation_window_hours, refund_window_hours,
  policy, whatsapp_template,
  version, updated_by
) VALUES (
  1,
  'Razia Driving Center',
  '',
  'https://raziadrivingcenter.com',
  '#FF6201', '#FF3131',
  '+92 309 4461407', '923094461407', 'raziadrivingcenter@gmail.com',
  '28/A, S Block, Gulberg 2', 'Lahore', 'Pakistan', '54660',
  '{}'::jsonb,
  '',
  'PKR', 'en-PK', 'Asia/Karachi', 'en', false,
  31.5201889, 74.3575145, 20, 20, '/map-style.json',
  50, 2, 0, 'nearest_1', 15,
  30, '07:00', '19:00', '18:30', '[]'::jsonb,
  '[
    {"id":"basic","name":"Basic Plan","price":9999,"days":7,"minutes_per_day":30,"free_pickup_km":0,"active":true},
    {"id":"plus","name":"PLUS Plan","price":14500,"days":10,"minutes_per_day":30,"free_pickup_km":2,"active":true},
    {"id":"pro_plus","name":"PRO+ Plan","price":21750,"days":15,"minutes_per_day":30,"free_pickup_km":0,"active":true}
  ]'::jsonb,
  '[]'::jsonb,
  '',
  false, '["card","cash"]'::jsonb, 'none',
  0, 0,
  '{
    "terms_url": "/terms/",
    "privacy_url": "/privacy-policy/",
    "payment_procedure_url": "/payment-procedure/",
    "terms_text": "[FILL IN]",
    "privacy_text": "[FILL IN]",
    "payment_procedure_text": "[FILL IN]",
    "refund_policy_text": "[FILL IN]"
  }'::jsonb,
  E'Hello {school_name}\n\nI want to book a slot.\nDate: {date}\nTime: {time}\nCourse: {course}\nBooking ID: #{booking_id}',
  1,
  'migration-012'
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. Record the migration
-- -----------------------------------------------------------------------------
INSERT INTO public.schema_migrations (version, description)
VALUES ('012', 'per-school configuration, config versioning, booking config stamp')
ON CONFLICT (version) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- APPLYING THIS MIGRATION
--
--   1. BACK UP FIRST. In the Supabase dashboard: Database → Backups. This
--      migration is additive (new tables, one new nullable column, one new
--      trigger) and does not rewrite or delete any existing row, but the seed
--      inserts one row into a new table — take a backup before running it.
--
--   2. Run the whole file in the SQL Editor. It is wrapped in BEGIN/COMMIT.
--
--   3. Verify:
--        select version, school_name, rate_per_km, service_radius_km from school_config;
--        select count(*) from school_config_history;          -- expect 0
--        select version from schema_migrations order by version;
--          -- expect 001-009, 011, 012 (010 has no migration file).
--          -- On a brand-new project only 012 is recorded, because there is
--          -- nothing older to confirm.
--        insert into booking_requests (...) values (...);     -- config_version set
--
--   4. ROLLBACK: there is no automated rollback. To undo, in one transaction:
--        DROP TRIGGER booking_requests_stamp_config_version ON booking_requests;
--        DROP FUNCTION booking_requests_stamp_config_version();
--        ALTER TABLE booking_requests DROP COLUMN config_version;
--        DROP VIEW school_config_public;
--        DROP FUNCTION update_school_config(integer, jsonb, text);
--        DROP FUNCTION school_config_validate();
--        DROP TABLE school_config_history;
--        DELETE FROM school_config WHERE id = 1;
--        DROP TABLE school_config;
--        DELETE FROM schema_migrations WHERE version = '012';
--      (Dropping the table loses the history — that is intended on a full undo.)
-- =============================================================================
