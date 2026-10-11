-- =============================================================================
-- Razia Driving Center — Slots & Bookings Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SLOTS TABLE
-- Pre-defined time slots that can be booked by customers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slots (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slot_date     date        NOT NULL,
    time_start    time        NOT NULL,
    time_end      time        NOT NULL,
    status        text        NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'booked', 'blocked')),
    instructor_type text      NOT NULL DEFAULT 'female'
                    CHECK (instructor_type IN ('female', 'male')),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slots_date_status
    ON public.slots (slot_date, status);

-- RLS: allow anon to read available slots only
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_available_slots" ON public.slots;
CREATE POLICY "anon_select_available_slots"
    ON public.slots
    FOR SELECT
    TO anon
    USING (status = 'available');

-- No INSERT/UPDATE/DELETE for anon — only service_role manages slots

-- -----------------------------------------------------------------------------
-- 2. BOOKINGS TABLE
-- Customer reservations linked to a slot.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name   text        NOT NULL,
    phone_number    text        NOT NULL,
    pickup_address  text,
    distance_km     numeric(5,1),
    total_fee       numeric(10,2),
    slot_id         bigint      NOT NULL REFERENCES public.slots(id),
    status          text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    plan_type       text,
    notes           text,
    source          text        DEFAULT 'website',
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON public.bookings (slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings (created_at DESC);

-- RLS: anon can INSERT only (submit a booking)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_booking" ON public.bookings;
CREATE POLICY "anon_insert_booking"
    ON public.bookings
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for anon

-- -----------------------------------------------------------------------------
-- 3. RPC: get_available_slots(date)
-- Returns all available slots for a given date.
-- SECURITY DEFINER runs with elevated privileges so anon can call it.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_available_slots(p_date date)
RETURNS TABLE (
    id              bigint,
    slot_date       date,
    time_start      time,
    time_end        time,
    status          text,
    instructor_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.slot_date,
        s.time_start,
        s.time_end,
        s.status,
        s.instructor_type
    FROM public.slots s
    WHERE s.slot_date = p_date
      AND s.status = 'available'
    ORDER BY s.time_start;
END;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION public.get_available_slots(date) TO anon;

-- -----------------------------------------------------------------------------
-- 4. RPC: submit_booking_v2(...)
-- Inserts a booking and marks the slot as booked atomically.
-- SECURITY DEFINER so anon can invoke it.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_booking_v2(
    p_customer_name   text,
    p_phone_number    text,
    p_slot_id         bigint,
    p_pickup_address  text   DEFAULT NULL,
    p_distance_km     numeric DEFAULT NULL,
    p_total_fee       numeric DEFAULT NULL,
    p_plan_type       text   DEFAULT NULL,
    p_notes           text   DEFAULT NULL,
    p_source          text   DEFAULT 'api-v1'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot_status text;
    v_booking_id  bigint;
BEGIN
    -- Lock the slot row and check availability
    SELECT status INTO v_slot_status
    FROM public.slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot % not found', p_slot_id;
    END IF;

    IF v_slot_status != 'available' THEN
        RAISE EXCEPTION 'Slot already booked or not available';
    END IF;

    -- Insert the booking
    INSERT INTO public.bookings (
        customer_name,
        phone_number,
        pickup_address,
        distance_km,
        total_fee,
        slot_id,
        plan_type,
        notes,
        source
    ) VALUES (
        p_customer_name,
        p_phone_number,
        p_pickup_address,
        p_distance_km,
        p_total_fee,
        p_slot_id,
        p_plan_type,
        p_notes,
        p_source
    )
    RETURNING id INTO v_booking_id;

    -- Mark slot as booked
    UPDATE public.slots
    SET status = 'booked'
    WHERE id = p_slot_id;

    RETURN v_booking_id::text;
END;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION public.submit_booking_v2(
    text, text, text, numeric, numeric, bigint, text, text, text
) TO anon;

-- -----------------------------------------------------------------------------
-- 5. SEED: Generate sample slots for the next 30 days
-- Run manually if you want test data. Adjust time ranges as needed.
-- -----------------------------------------------------------------------------
-- INSERT INTO public.slots (slot_date, time_start, time_end, instructor_type)
-- SELECT
--     d::date,
--     t.start_t,
--     t.end_t,
--     'female'
-- FROM generate_series(current_date, current_date + 30, '1 day') AS d
-- CROSS JOIN (VALUES
--     ('08:00'::time, '10:00'::time),
--     ('10:00'::time, '12:00'::time),
--     ('12:00'::time, '14:00'::time),
--     ('14:00'::time, '16:00'::time),
--     ('16:00'::time, '18:00'::time),
--     ('18:00'::time, '20:00'::time)
-- ) AS t(start_t, end_t);
