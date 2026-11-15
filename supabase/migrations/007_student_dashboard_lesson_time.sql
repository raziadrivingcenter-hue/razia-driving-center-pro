-- =============================================================================
-- Migration 007 — expose lesson_time and sort lessons chronologically
--
-- WHY:
-- The student dashboard lesson grid needs each lesson's scheduled start time
-- (the Slot column) and ascending chronological ordering (earliest first).
--
-- Migration 006's get_portal_progress / get_my_progress RPCs do not return
-- lesson_time, and they order by lesson_date DESC. Both return shapes and
-- orders need to change.
--
-- PostgreSQL's CREATE OR REPLACE FUNCTION cannot change the number of output
-- columns of an existing function, so each RPC is dropped and recreated with
-- the new RETURNS TABLE shape, then its security posture (search_path, RLS
-- bypass via SECURITY DEFINER, authenticated-only EXECUTE grant, anon/public
-- revoke) is reapplied byte-for-byte.
--
-- Desktop-managed public.lessons and public.lesson_tracking_sessions are left
-- untouched — this migration only changes the two read RPCs that already join
-- them.
--
-- STATUS: NOT YET EXECUTED — apply to production after review.
-- =============================================================================

-- ── get_portal_progress: add lesson_time, sort ascending (earliest first) ──
-- Drop first: CREATE OR REPLACE cannot widen the RETURNS TABLE shape.
drop function if exists public.get_portal_progress();

create function public.get_portal_progress()
returns table (
  lesson_number integer, lesson_date text, lesson_time text,
  duration_minutes integer, status text, course text, vehicle text,
  distance_km double precision, duration_seconds integer,
  started_at timestamptz, ended_at timestamptz,
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
  select l.lesson_number, l.lesson_date::text, l.lesson_time::text,
         l.duration_minutes, l.status, l.course, l.vehicle,
         t.distance_km, t.duration_seconds, t.started_at, t.ended_at,
         t.point_count, t.tracking_status
  from public.lessons l
  join targets x on l.student_id = x.student_id
  left join public.lesson_tracking_sessions t on t.lesson_id = l.local_id
  where (select count(*) from targets) = 1
  order by l.lesson_date asc, l.lesson_time asc;
$$;
revoke all on function public.get_portal_progress() from public, anon;
grant execute on function public.get_portal_progress() to authenticated;

-- ── get_my_progress: add lesson_time, sort ascending (earliest first) ──
drop function if exists public.get_my_progress();

create function public.get_my_progress()
returns table (
  lesson_number integer, lesson_date text, lesson_time text,
  duration_minutes integer, status text, course text, vehicle text,
  distance_km double precision, duration_seconds integer,
  started_at timestamptz, ended_at timestamptz,
  point_count integer, tracking_status text
)
language sql stable security definer
set search_path = ''
AS $$
  select l.lesson_number, l.lesson_date::text, l.lesson_time::text,
         l.duration_minutes, l.status, l.course, l.vehicle,
         t.distance_km, t.duration_seconds, t.started_at, t.ended_at,
         t.point_count, t.tracking_status
  from public.student_link s
  join public.lessons l on l.student_id = s.student_id
  left join public.lesson_tracking_sessions t on t.lesson_id = l.local_id
  where s.auth_user_id = auth.uid()
  order by l.lesson_date asc, l.lesson_time asc;
$$;
revoke all on function public.get_my_progress() from public, anon;
grant execute on function public.get_my_progress() to authenticated;
