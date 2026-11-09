-- =============================================================================
-- THROWAWAY TEST PROJECT — base table setup
-- =============================================================================
--
-- ⚠️  SIRF TEST KE LIYE. Apne REAL project me yeh KABHI na chalayein.
--
-- Iska kaam sirf yeh hai ke throwaway project me `booking_requests` table
-- ban jaye, taake migrations 011 aur 012 ko test kiya ja sake.
--
-- Kyun zaroori hai:
--   Repo ki kisi bhi migration file me `booking_requests` NAHI banta.
--   (001..009 tables/functions banate hain, lekin yeh table real database me
--    pehle se mojood hai.) 011 aur 012 isi table ko chhueinge, is liye bina
--    is ke dono FAIL ho jayengi.
--
-- Baaki sab 011 aur 012 khud bana dete hain:
--   011 → payment columns + payment_events + booking_slot_holds + functions
--   12 → school_config + history + public view + update_school_config + trigger
--
-- Table ka DDL desktop app ke apne customer-facing SQL se liya gaya hai
-- (src/pages/Settings/components/WebsiteConnectorCard.tsx), yani yeh wohi
-- shape hai jo ek nayi school ke Supabase project me chalta hai.
--
-- Chalane ka tareeka:
--   Throwaway project → SQL Editor → New query → yeh poori file paste → Run
--
-- Pass/Fail:
--   "Success" + neeche wale 2 queries me 1 row → Pass
--   ERROR → Fail (Messages tab dekhein)
-- =============================================================================

BEGIN;

-- Pehle safety guard: agar table pehle se hai to ruk jao. Isse purana data
-- (agar ho) kisi bhi haal me nahi mitega.
DO $$
BEGIN
  IF to_regclass('public.booking_requests') IS NOT NULL THEN
    RAISE EXCEPTION
      'booking_requests pehle se mojood hai. Yeh file SIRF khaali (empty) project ke liye hai. Agar dobara shuru karna hai to pehle throwaway project ko delete kar ke naya banayein.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- booking_requests — website ki booking requests yahan jati hain
-- -----------------------------------------------------------------------------
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  preferred_course text,
  message text,

  source text,
  area text,
  city text,
  address text,
  preferred_date text,
  preferred_time text,
  pickup_location text,
  dropoff_location text,
  home_service boolean,
  distance_km numeric,
  extra jsonb,

  status text not null default 'pending',

  -- Website → Bookings lifecycle. NULL on pre-migration rows (treated as
  -- not-added); otherwise the student-added flag drives the green "Added to
  -- System" card state. Kept separate from status so the pending/accepted/
  -- declined values (and the polling query that filters on them) are untouched.
  student_added boolean not null default false,

  created_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

create policy "Public can submit booking requests"
on public.booking_requests
for insert
to anon
with check (true);

-- Public website: submit bookings only.
-- The website uses the anon/public key and must NOT be able to read,
-- modify, or delete existing booking requests.
grant insert
on public.booking_requests
to anon;

-- SoD Driving School Pro: securely read and manage booking requests from
-- the private desktop application using the service-role credential.
grant select, insert, update, delete
on public.booking_requests
to service_role;

COMMIT;

-- -----------------------------------------------------------------------------
-- Verify — yeh 2 queries chalayein. Dono me 1 row aani chahiye.
-- -----------------------------------------------------------------------------
-- 1) Table ban gai?
select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name = 'booking_requests';

-- 2) Koi data to nahi? (0 rows chahiye)
select count(*) as row_count from public.booking_requests;
