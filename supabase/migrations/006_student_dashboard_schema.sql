-- =============================================================================
-- Migration 006 — student progress dashboard schema
--
-- WHY:
-- The student dashboard at /dashboard/ calls four SECURITY DEFINER RPCs
-- (resolve_portal_student, get_portal_progress, get_my_link, get_my_progress)
-- against two private tables (student_portal_registry, student_link). None of
-- these objects exist in production — they were only ever defined in the test
-- harness's SETUP_SQL — so every dashboard load hits "function not found" and
-- shows "Couldn't load your dashboard."
--
-- This migration creates only the genuinely missing dashboard objects. It does
-- NOT touch the desktop-managed public.lessons or
-- public.lesson_tracking_sessions tables (the SoD Electron app owns those), and
-- it does NOT create the legacy enrollment_requests table or
-- submit_enrollment_request() RPC — those are unused by the current enrollment
-- flow, which routes through /slot-availability/ (EnrollNow.jsx).
--
-- FRONTEND CONTRACT (src/lib/progress.js + src/components/Dashboard.jsx):
--   resolve_portal_student  → one row { status, student_id, source }
--     status ∈ "linked" | "no_match" | "no_course" | "multiple"
--     source ∈ "registry" | null
--     Dashboard branches: "linked"→show progress, "multiple"→contact school,
--     else → legacy-link fallback → Enroll Now.
--   get_portal_progress / get_my_progress → rows the UI reads:
--     lesson_date, course, distance_km, duration_minutes, status, duration_seconds
--   get_my_link → scalar boolean
--
-- FIX vs. the test-harness SETUP_SQL:
--   * resolve_portal_student returned column `match_status` (code reads `status`)
--     and value `'none'` (code expects `no_match`). Renamed + fixed, and added
--     the missing `source` column the code's return type declares.
--   * Removed the unused enrollment_requests table + submit_enrollment_request.
--
-- SECURITY NOTES:
--   * Both registry-based RPCs require auth.users.email_confirmed_at IS NOT NULL
--     before matching the caller's email. Unconfirmed or missing emails match
--     nothing — resolve_portal_student returns 'no_match' (which falls through
--     to the legacy-link path), get_portal_progress returns zero rows.
--   * get_portal_progress returns rows only when the confirmed email matches
--     exactly one distinct student_id in student_portal_registry. Ambiguous
--     matches (>1 student) and no matches return zero rows — it never picks an
--     arbitrary student via LIMIT 1.
--
-- STATUS: NOT YET EXECUTED — apply to production after review.
-- =============================================================================

-- ── student_portal_registry (published by the SoD desktop app; private) ──
-- May already exist if the desktop app has created it; use IF NOT EXISTS so a
-- pre-existing table (with its data) is never dropped.
create table if not exists public.student_portal_registry (
  student_id integer not null primary key,
  email      text not null,
  synced_at  timestamptz not null default now()
);
-- Desktop app manages this table (service_role); the website never reads it
-- directly. Revoke all public access and grant full DML to service_role only.
revoke all on public.student_portal_registry from public, anon, authenticated;
grant select, insert, update, delete on public.student_portal_registry to service_role;
alter table public.student_portal_registry enable row level security;

-- ── student_link (legacy auth-user → student mapping; admin-maintained) ──
create table if not exists public.student_link (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  student_id   integer not null,
  created_at   timestamptz not null default now()
);
-- Private: the website only touches this through the RPCs. RLS on, no direct
-- PostgREST access for anon or authenticated users.
alter table public.student_link enable row level security;
revoke all on public.student_link from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- RPCs: all SECURITY DEFINER with an empty search_path (prevents search_path
-- injection — a caller cannot redirect the function's unqualified references
-- to a shadowing schema). Every reference inside these bodies is fully
-- qualified (public.*, auth.users, auth.uid()), so the empty search_path is
-- safe and intentional. EXECUTE is granted to authenticated only; anon is
-- denied at the privilege gate. auth.uid() still resolves to the caller's JWT
-- identity because it reads the request's `sub` claim, not the session role.
-- ─────────────────────────────────────────────────────────────────────────

-- ── resolve_portal_student: match auth user's email to a registry row ──
-- Returns the coarse status the Dashboard branches on. FIX vs. SETUP_SQL:
--   - column renamed match_status → status
--   - value 'none' → 'no_match'
--   - added `source` column (code's return type declares it)
--   - only matches confirmed emails (email_confirmed_at IS NOT NULL)
create or replace function public.resolve_portal_student()
returns table (status text, student_id integer, source text)
language sql stable security definer
set search_path = ''
AS $$
  with mine as (
    select lower(trim(email)) as email
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  ),
  hits as (
    select r.student_id
    from public.student_portal_registry r
    join mine m on lower(trim(r.email)) = m.email
  )
  select
    case
      when (select count(*) from hits) = 0 then 'no_match'::text
      when (select count(*) from hits) > 1 then 'multiple'::text
      when exists (
        select 1 from public.lessons l
        join hits h on l.student_id = h.student_id
      ) then 'linked'::text
      else 'no_course'::text
    end,
    case
      when (select count(*) from hits) = 1 then (select h.student_id from hits h limit 1)
      else null::integer
    end,
    case
      when (select count(*) from hits) >= 1 then 'registry'::text
      else null::text
    end;
$$;
revoke all on function public.resolve_portal_student() from public, anon;
grant execute on function public.resolve_portal_student() to authenticated;

-- ── get_portal_progress: lessons for the resolved registry student ──
-- Returns rows only when the caller's confirmed email matches exactly one
-- distinct student_id in student_portal_registry. Zero rows for no match or
-- for ambiguous (>1) matches — never picks an arbitrary student.
create or replace function public.get_portal_progress()
returns table (
  lesson_number integer, lesson_date text, duration_minutes integer,
  status text, course text, vehicle text, distance_km double precision,
  duration_seconds integer, started_at timestamptz, ended_at timestamptz,
  point_count integer, tracking_status text
)
language sql stable security definer
set search_path = ''
AS $$
  with mine as (
    select lower(trim(email)) as email
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  ),
  targets as (
    select distinct r.student_id
    from public.student_portal_registry r
    join mine m on lower(trim(r.email)) = m.email
  )
  select l.lesson_number, l.lesson_date::text, l.duration_minutes, l.status, l.course,
         l.vehicle, t.distance_km, t.duration_seconds, t.started_at, t.ended_at,
         t.point_count, t.tracking_status
  from public.lessons l
  join targets x on l.student_id = x.student_id
  left join public.lesson_tracking_sessions t on t.lesson_id = l.local_id
  where (select count(*) from targets) = 1
  order by l.lesson_date desc;
$$;
revoke all on function public.get_portal_progress() from public, anon;
grant execute on function public.get_portal_progress() to authenticated;

-- ── get_my_link: does the current auth user have a legacy student_link row? ──
create or replace function public.get_my_link()
returns boolean
language sql stable security definer
set search_path = ''
AS $$
  select exists (select 1 from public.student_link s where s.auth_user_id = auth.uid());
$$;
revoke all on function public.get_my_link() from public, anon;
grant execute on function public.get_my_link() to authenticated;

-- ── get_my_progress: lessons via the legacy student_link mapping ──
create or replace function public.get_my_progress()
returns table (
  lesson_number integer, lesson_date text, duration_minutes integer,
  status text, course text, vehicle text, distance_km double precision,
  duration_seconds integer, started_at timestamptz, ended_at timestamptz,
  point_count integer, tracking_status text
)
language sql stable security definer
set search_path = ''
AS $$
  select l.lesson_number, l.lesson_date::text, l.duration_minutes, l.status, l.course,
         l.vehicle, t.distance_km, t.duration_seconds, t.started_at, t.ended_at,
         t.point_count, t.tracking_status
  from public.student_link s
  join public.lessons l on l.student_id = s.student_id
  left join public.lesson_tracking_sessions t on t.lesson_id = l.local_id
  where s.auth_user_id = auth.uid()
  order by l.lesson_date desc;
$$;
revoke all on function public.get_my_progress() from public, anon;
grant execute on function public.get_my_progress() to authenticated;
