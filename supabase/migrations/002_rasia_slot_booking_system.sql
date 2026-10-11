-- =============================================================================
-- Razia Driving Center — Slot Booking System (Multi-Day with Travel Buffer)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- SLOT SYSTEM RULES:
-- - 30-minute training slots, operating hours 8:00 AM – 8:00 PM
-- - Travel buffer: distance_km × 5 minutes each way
-- - A booking blocks: (slot_time - travel_before) to (slot_time + 30 min training)
--   for EVERY day from course_start_date to course_end_date
-- - Example: 12:30 slot, 3km distance → blocked 12:15–13:00 for all course days
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CLEANUP: Drop old tables/functions from previous migration
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_available_slots(date);
DROP FUNCTION IF EXISTS public.submit_booking_v2(text, text, bigint, text, numeric, numeric, text, text, text);
DROP FUNCTION IF EXISTS public.submit_booking_v2(text, text, text, numeric, numeric, bigint, text, text, text);
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.slots;

-- -----------------------------------------------------------------------------
-- 1. BOOKINGS TABLE
-- Each booking stores the preferred time + multi-day course range + travel info.
-- -----------------------------------------------------------------------------
CREATE TABLE public.bookings (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name       text        NOT NULL,
    phone_number        text        NOT NULL,
    pickup_address      text,
    area                text,
    distance_km         numeric(5,1) DEFAULT 0,
    travel_time_min     integer     DEFAULT 0,  -- one-way travel minutes (distance_km × 5)
    slot_time           time        NOT NULL,   -- preferred daily training time (e.g., 12:30)
    course_start_date   date        NOT NULL,
    course_end_date     date        NOT NULL,   -- start_date + duration_days - 1
    duration_days       integer     NOT NULL,
    plan_type           text        NOT NULL,   -- basic, plus, pro
    course_fee          numeric(10,2),
    distance_fee        numeric(10,2),
    total_fee           numeric(10,2),
    status              text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    notes               text,
    source              text        DEFAULT 'website',
    created_at          timestamptz NOT NULL DEFAULT now(),
    -- Ensure end_date is not before start_date
    CONSTRAINT valid_date_range CHECK (course_end_date >= course_start_date)
);

CREATE INDEX idx_bookings_date_range ON public.bookings (course_start_date, course_end_date);
CREATE INDEX idx_bookings_status ON public.bookings (status);
CREATE INDEX idx_bookings_slot_time ON public.bookings (slot_time);
CREATE INDEX idx_bookings_created ON public.bookings (created_at DESC);

-- RLS: anon can INSERT only
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_booking" ON public.bookings;
CREATE POLICY "anon_insert_booking"
    ON public.bookings
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2. RPC: get_available_slots(p_date date)
-- Generates all 30-min slots for the day, then excludes those blocked by
-- any active booking overlapping this date.
--
-- A booking blocks a slot if:
--   p_date is within [course_start_date, course_end_date]
--   AND the slot falls within [slot_time - travel_time_min, slot_time + 30 min]
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date)
RETURNS TABLE (
    slot_time   time,
    available   boolean,
    reason      text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot_time time := '08:00'::time;
    v_end_time  time := '20:00'::time;
    v_slot_duration interval := '30 minutes';
    v_is_blocked boolean;
    v_block_reason text;
    v_booking record;
BEGIN
    -- Generate 30-minute slots from 08:00 to 20:00
    WHILE v_slot_time < v_end_time LOOP
        v_is_blocked := false;
        v_block_reason := NULL;

        -- Check if any active booking blocks this slot on this date
        FOR v_booking IN
            SELECT b.slot_time, b.travel_time_min, b.course_start_date, b.course_end_date, b.customer_name
            FROM public.bookings b
            WHERE b.status IN ('pending', 'confirmed')
              AND p_date BETWEEN b.course_start_date AND b.course_end_date
        LOOP
            -- Blocked window: (slot_time - travel_min) to (slot_time + 30 min)
            IF v_slot_time >= (v_booking.slot_time - (v_booking.travel_time_min || ' minutes')::interval)
               AND v_slot_time < (v_booking.slot_time + '30 minutes'::interval)
            THEN
                v_is_blocked := true;
                v_block_reason := 'Booked';
                EXIT;  -- No need to check further
            END IF;
        END LOOP;

        slot_time := v_slot_time;
        available := NOT v_is_blocked;
        reason := v_block_reason;

        RETURN NEXT;
        v_slot_time := v_slot_time + v_slot_duration;
    END LOOP;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(date) TO anon;

-- -----------------------------------------------------------------------------
-- 3. RPC: submit_booking(...)
-- Creates a booking with multi-day slot blocking.
-- Calculates travel_time_min from distance_km (× 5 min per km).
-- Calculates course_end_date from start_date + duration_days.
-- Checks for slot conflicts before inserting.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_booking(
    p_customer_name     text,
    p_phone_number      text,
    p_slot_time         time,
    p_course_start_date date,
    p_duration_days     integer,
    p_plan_type         text,
    p_distance_km       numeric    DEFAULT 0,
    p_pickup_address    text       DEFAULT NULL,
    p_area              text       DEFAULT NULL,
    p_course_fee        numeric    DEFAULT 0,
    p_distance_fee      numeric    DEFAULT 0,
    p_total_fee         numeric    DEFAULT 0,
    p_notes             text       DEFAULT NULL,
    p_source            text       DEFAULT 'api-v1'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_travel_time_min integer;
    v_course_end_date date;
    v_conflict_count integer;
    v_booking_id bigint;
BEGIN
    -- Calculate travel time: 5 min per km
    v_travel_time_min := GREATEST(0, (p_distance_km * 5)::integer);

    -- Calculate end date
    v_course_end_date := p_course_start_date + (p_duration_days - 1);

    -- Check for conflicts: any active booking that overlaps this slot on any course day
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings b
    WHERE b.status IN ('pending', 'confirmed')
      AND (p_course_start_date, v_course_end_date) OVERLAPS (b.course_start_date, b.course_end_date)
      AND (p_slot_time - (v_travel_time_min || ' minutes')::interval) < (b.slot_time + '30 minutes'::interval)
      AND (p_slot_time + '30 minutes'::interval) > (b.slot_time - (b.travel_time_min || ' minutes')::interval);

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Slot conflict: This time slot is already booked for one or more days of the selected course range.';
    END IF;

    -- Insert the booking
    INSERT INTO public.bookings (
        customer_name,
        phone_number,
        slot_time,
        course_start_date,
        course_end_date,
        duration_days,
        plan_type,
        distance_km,
        travel_time_min,
        pickup_address,
        area,
        course_fee,
        distance_fee,
        total_fee,
        notes,
        source
    ) VALUES (
        p_customer_name,
        p_phone_number,
        p_slot_time,
        p_course_start_date,
        v_course_end_date,
        p_duration_days,
        p_plan_type,
        p_distance_km,
        v_travel_time_min,
        p_pickup_address,
        p_area,
        p_course_fee,
        p_distance_fee,
        p_total_fee,
        p_notes,
        p_source
    )
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_booking(
    text, text, time, date, integer, text, numeric, text, text, numeric, numeric, numeric, text, text
) TO anon;

-- -----------------------------------------------------------------------------
-- 4. RPC: calculate_travel_time(distance_km)
-- Helper: returns travel minutes for a given distance.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_travel_time(p_distance_km numeric)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(0, (p_distance_km * 5)::integer);
$$;

GRANT EXECUTE ON FUNCTION public.calculate_travel_time(numeric) TO anon;
