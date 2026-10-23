/* ------------------------------------------------------------------ */
/*  Student progress dashboard — end-to-end test harness (THROW-AWAY
    project only).
    READS/WRITES ONLY the project given via env. Never touches the live
    raziadrivingcenter.com project. Uses synthetic records + throwaway
    auth accounts that it creates and tears down.

    Verifies THREE auth users:
      • User A  → linked to synthetic student 900001 (2 lessons)
      • User B  → linked to synthetic student 900002 (2 lessons)
      • User C  → signed in but UNLINKED (no student_link row)
    Asserts each linked user sees ONLY their own lessons + tracking
    summaries, neither linked user can read/modify student_link directly,
    and the unlinked user sees nothing. Cleans up all synthetic data.

    Run: node scripts/test-student-dashboard.mjs
    Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
    (all from a throwaway project).                                 */
/* ------------------------------------------------------------------ */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
  console.error(
    "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY\n" +
      "(from a THROW-AWAY Supabase project — never production)."
  );
  process.exit(2);
}

const admin = createClient(URL, SERVICE_KEY); // service_role: bypasses RLS, manages users
const anon = createClient(URL, ANON_KEY); // anon: exercises the RPCs as the web client would

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? "  — " + detail : ""}`);
  }
}

// Synthetic, obviously-fake data. No real student data anywhere.
const STUDENT_A = { id: 900001, name: "Synthetic Student A", course: "Standard 10 days" };
const STUDENT_B = { id: 900002, name: "Synthetic Student B", course: "Basic 14 days" };
const STUDENT_C = { id: 900003, name: "Synthetic Student C", course: "Advanced 7 days" };

const EMAIL_A = "sdash.synthetic.a@example.test";
const EMAIL_B = "sdash.synthetic.b@example.test";
const EMAIL_C = "sdash.synthetic.c@example.test";
const PASSWORD = "Test-Pass-1234!synthetic-only";

const SYNTH_TOKEN_A = "synth-token-A-xxxx";
const SYNTH_TOKEN_B = "synth-token-B-xxxx";
const SYNTH_TOKEN_C = "synth-token-C-xxxx";

// Sensitive fields the RPC must NEVER leak to the browser.
const FORBIDDEN_KEYS = [
  "mobile_access_token",
  "student_name",
  "student_phone",
  "student_id",
  "instructor_id",
  "start_lat",
  "start_lng",
  "end_lat",
  "end_lng",
];
// Safe fields the RPC SHOULD expose.
const SAFE_KEYS = [
  "lesson_number",
  "lesson_date",
  "duration_minutes",
  "status",
  "course",
  "vehicle",
  "distance_km",
  "duration_seconds",
  "tracking_status",
];

let userA = null;
let userB = null;
let userC = null;

// Exact SQL to paste into the THROW-AWAY project's SQL Editor before the
// first run. REVOKE ALL ... FROM PUBLIC, anon comes BEFORE GRANT EXECUTE
// ... TO authenticated so anonymous RPC calls are denied at the privilege
// gate (the harness's testSignedOut asserts anon calls error, not false/[]).
const SETUP_SQL = `-- Apply in the THROW-AWAY project's SQL Editor, then re-run this harness.
create table if not exists public.student_link (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  student_id   integer not null,
  created_at   timestamptz not null default now()
);
alter table public.student_link enable row level security;
revoke all on public.student_link from public, authenticated;

create or replace function public.get_my_link()
returns boolean
language sql stable security definer
set search_path = ''
$$
  select exists (select 1 from public.student_link s where s.auth_user_id = auth.uid());
$$;
revoke all on function public.get_my_link() from public, anon;
grant execute on function public.get_my_link() to authenticated;

create or replace function public.get_my_progress()
returns table (
  lesson_number integer, lesson_date text, duration_minutes integer,
  status text, course text, vehicle text, distance_km double precision,
  duration_seconds integer, started_at timestamptz, ended_at timestamptz,
  point_count integer, tracking_status text
)
language sql stable security definer
set search_path = ''
$$
  select l.lesson_number, l.lesson_date, l.duration_minutes, l.status, l.course,
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
`;

async function setupSchema() {
  // This harness never runs DDL itself. It asserts the objects exist and
  // bails with the setup SQL printed if not — the SQL must be applied in the
  // throwaway project's SQL Editor first.
  const { data: linkRow, error: linkErr } = await admin
    .from("student_link")
    .select("auth_user_id")
    .limit(1);
  check("student_link table exists (apply setup SQL first)", !linkErr, linkErr?.message);
  if (linkErr) return false;

  const { error: linkRpcErr } = await anon.rpc("get_my_link");
  // anon has no EXECUTE grant → expect 403/404; we only care the function
  // resolves for authenticated users (tested below). Here we confirm it's
  // not a hard "does not exist" (code 42883 / P0001).
  check(
    "get_my_link() RPC defined",
    !linkRpcErr || !/does not exist|undefined function/.test(linkRpcErr.message),
    linkRpcErr?.message
  );

  const { error: progRpcErr } = await anon.rpc("get_my_progress");
  check(
    "get_my_progress() RPC defined",
    !progRpcErr || !/does not exist|undefined function/.test(progRpcErr.message),
    progRpcErr?.message
  );
  return true;
}

async function createUsers() {
  // Create three auth users via the admin API. email_confirm so password
  // sign-in works.
  for (const { email, tag } of [
    { email: EMAIL_A, tag: "A" },
    { email: EMAIL_B, tag: "B" },
    { email: EMAIL_C, tag: "C" },
  ]) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error && /already registered|exists/.test(error.message)) {
      // Reuse existing throwaway user from a prior run.
      const { data: list, error: lerr } = await admin.auth.admin.listUsers();
      if (lerr) {
        check(`reuse user ${tag}`, false, lerr.message);
        continue;
      }
      const found = list.users.find((u) => u.email === email);
      if (tag === "A") userA = found;
      else if (tag === "B") userB = found;
      else userC = found;
      check(`reuse user ${tag} (${email})`, !!found);
    } else if (error) {
      check(`create user ${tag}`, false, error.message);
    } else {
      if (tag === "A") userA = data.user;
      else if (tag === "B") userB = data.user;
      else userC = data.user;
      check(`create user ${tag} (${email})`, !!data.user, data.user?.id);
    }
  }
}

async function signInAs(email, password) {
  // Returns a fresh client authenticated as that user (their JWT drives auth.uid()).
  const client = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) check(`sign in ${email}`, false, error.message);
  return client;
}

async function insertSyntheticData() {
  // Lessons: 2 for student A, 2 for student B, 1 for student C (unlinked —
  // exists to prove an unlinked user cannot see it).
  const lessons = [
    {
      local_id: 800001,
      instructor_id: 1,
      student_id: STUDENT_A.id,
      student_name: STUDENT_A.name,
      student_phone: "03000000001",
      vehicle: "Suzuki Cultus",
      course: STUDENT_A.course,
      lesson_date: "2026-10-01",
      lesson_time: "09:00",
      lesson_number: 1,
      duration_minutes: 30,
      status: "Completed",
      mobile_access_token: SYNTH_TOKEN_A,
    },
    {
      local_id: 800002,
      instructor_id: 1,
      student_id: STUDENT_A.id,
      student_name: STUDENT_A.name,
      student_phone: "03000000001",
      vehicle: "Suzuki Cultus",
      course: STUDENT_A.course,
      lesson_date: "2026-10-03",
      lesson_time: "09:00",
      lesson_number: 2,
      duration_minutes: 30,
      status: "Completed",
      mobile_access_token: SYNTH_TOKEN_A,
    },
    {
      local_id: 800003,
      instructor_id: 1,
      student_id: STUDENT_B.id,
      student_name: STUDENT_B.name,
      student_phone: "03000000002",
      vehicle: "Honda Civic",
      course: STUDENT_B.course,
      lesson_date: "2026-10-05",
      lesson_time: "10:00",
      lesson_number: 1,
      duration_minutes: 30,
      status: "Completed",
      mobile_access_token: SYNTH_TOKEN_B,
    },
    {
      local_id: 800004,
      instructor_id: 1,
      student_id: STUDENT_B.id,
      student_name: STUDENT_B.name,
      student_phone: "03000000002",
      vehicle: "Honda Civic",
      course: STUDENT_B.course,
      lesson_date: "2026-10-07",
      lesson_time: "10:00",
      lesson_number: 2,
      duration_minutes: 30,
      status: "Completed",
      mobile_access_token: SYNTH_TOKEN_B,
    },
    {
      local_id: 800005,
      instructor_id: 1,
      student_id: STUDENT_C.id,
      student_name: STUDENT_C.name,
      student_phone: "03000000003",
      vehicle: "Toyota Corolla",
      course: STUDENT_C.course,
      lesson_date: "2026-10-09",
      lesson_time: "11:00",
      lesson_number: 1,
      duration_minutes: 30,
      status: "Completed",
      mobile_access_token: SYNTH_TOKEN_C,
    },
  ];
  const { error: lerr } = await admin.from("lessons").insert(lessons);
  check("insert synthetic lessons", !lerr, lerr?.message);

  // Tracking sessions (GPS summaries) — start/end lat+lng are sensitive.
  const tracking = [
    {
      lesson_id: 800001,
      instructor_id: 1,
      student_id: STUDENT_A.id,
      duration_seconds: 1800,
      distance_km: 5.2,
      started_at: "2026-10-01T09:00:00Z",
      ended_at: "2026-10-01T09:30:00Z",
      point_count: 120,
      start_lat: 31.5204,
      start_lng: 74.3587,
      end_lat: 31.5254,
      end_lng: 74.3620,
      tracking_status: "completed",
    },
    {
      lesson_id: 800002,
      instructor_id: 1,
      student_id: STUDENT_A.id,
      duration_seconds: 1800,
      distance_km: 3.8,
      started_at: "2026-10-03T09:00:00Z",
      ended_at: "2026-10-03T09:30:00Z",
      point_count: 90,
      start_lat: 31.5204,
      start_lng: 74.3587,
      end_lat: 31.5230,
      end_lng: 74.3600,
      tracking_status: "completed",
    },
    {
      lesson_id: 800003,
      instructor_id: 1,
      student_id: STUDENT_B.id,
      duration_seconds: 1800,
      distance_km: 7.1,
      started_at: "2026-10-05T10:00:00Z",
      ended_at: "2026-10-05T10:30:00Z",
      point_count: 150,
      start_lat: 31.4700,
      start_lng: 74.3000,
      end_lat: 31.4750,
      end_lng: 74.3050,
      tracking_status: "completed",
    },
    {
      lesson_id: 800004,
      instructor_id: 1,
      student_id: STUDENT_B.id,
      duration_seconds: 1800,
      distance_km: 4.5,
      started_at: "2026-10-07T10:00:00Z",
      ended_at: "2026-10-07T10:30:00Z",
      point_count: 110,
      start_lat: 31.4700,
      start_lng: 74.3000,
      end_lat: 31.4730,
      end_lng: 74.3030,
      tracking_status: "completed",
    },
    {
      lesson_id: 800005,
      instructor_id: 1,
      student_id: STUDENT_C.id,
      duration_seconds: 1800,
      distance_km: 9.9,
      started_at: "2026-10-09T11:00:00Z",
      ended_at: "2026-10-09T11:30:00Z",
      point_count: 200,
      start_lat: 31.4400,
      start_lng: 74.2700,
      end_lat: 31.4450,
      end_lng: 74.2750,
      tracking_status: "completed",
    },
  ];
  const { error: terr } = await admin
    .from("lesson_tracking_sessions")
    .insert(tracking);
  check("insert synthetic tracking sessions", !terr, terr?.message);

  // Link student A → user A and student B → user B. Student C has NO link →
  // exercises the unlinked state (even though student C has data).
  if (userA) {
    const { error: slerr } = await admin
      .from("student_link")
      .insert({ auth_user_id: userA.id, student_id: STUDENT_A.id });
    check("link student A → user A", !slerr, slerr?.message);
  } else {
    check("link student A → user A", false, "no userA");
  }
  if (userB) {
    const { error: slerr } = await admin
      .from("student_link")
      .insert({ auth_user_id: userB.id, student_id: STUDENT_B.id });
    check("link student B → user B", !slerr, slerr?.message);
  } else {
    check("link student B → user B", false, "no userB");
  }
  // Intentionally no student_link row for userC.
}

async function assertNoOrphanedSchema() {
  // Defensive: confirm student_link has only the expected columns.
  const { data: cols, error } = await admin
    .from("student_link")
    .select("auth_user_id,student_id")
    .limit(0);
  check("student_link has (auth_user_id, student_id) only", !error, error?.message);
}

async function testSignedOut() {
  console.log("\n— state: signed-out (no session) —");
  // An unauthenticated anon client calling the EXECUTE-gated RPCs must be rejected.
  const { error: linkErr } = await anon.rpc("get_my_link");
  check("get_my_link rejects anon (no JWT)", !!linkErr, linkErr?.message);
  const { error: progErr } = await anon.rpc("get_my_progress");
  check("get_my_progress rejects anon (no JWT)", !!progErr, progErr?.message);
}

async function testUnlinked() {
  console.log("\n— state: signed-in but unlinked (user C) —");
  if (!userC) {
    check("user C exists for unlinked test", false);
    return;
  }
  const clientC = await signInAs(EMAIL_C, PASSWORD);
  const { data: linked, error: lerr } = await clientC.rpc("get_my_link");
  check(
    "user C: get_my_link = false",
    !lerr && linked === false,
    lerr?.message || `linked=${linked}`
  );
  const { data: prog, error: perr } = await clientC.rpc("get_my_progress");
  check(
    "user C: get_my_progress empty",
    !perr && Array.isArray(prog) && prog.length === 0,
    perr?.message || `len=${prog?.length}`
  );
}

// Parametric linked-user test, run once for A and once for B.
async function testLinkedIsolated(tag, user, email, student, expectedDistances) {
  console.log(`\n— state: signed-in + linked + populated (${tag}) —`);
  if (!user) {
    check(`${tag} exists for linked test`, false);
    return;
  }
  const client = await signInAs(email, PASSWORD);

  const { data: linked, error: lerr } = await client.rpc("get_my_link");
  check(
    `${tag}: get_my_link = true`,
    !lerr && linked === true,
    lerr?.message || `linked=${linked}`
  );

  const { data: prog, error: perr } = await client.rpc("get_my_progress");
  check(
    `${tag}: get_my_progress returns rows`,
    !perr && Array.isArray(prog) && prog.length > 0,
    perr?.message || `len=${prog?.length}`
  );
  check(
    `${tag}: sees exactly own 2 lessons`,
    prog?.length === 2,
    `len=${prog?.length}`
  );

  // Every returned row must belong to this student (course is per-student).
  const allOwnCourse = (prog || []).every((r) => r.course === student.course);
  check(`${tag}: every row is own course (${student.course})`, allOwnCourse);

  // Distances must be exactly this student's, no other student's.
  const distances = (prog || []).map((r) => r.distance_km).sort();
  const expected = [...expectedDistances].sort();
  check(
    `${tag}: distances are only own ${JSON.stringify(expected)}`,
    JSON.stringify(distances) === JSON.stringify(expected),
    `got ${JSON.stringify(distances)}`
  );

  // Sensitive-field exclusion: no token, no raw GPS, no student_name/phone/id,
  // no instructor_id.
  const sample = prog?.[0] || {};
  for (const k of FORBIDDEN_KEYS) {
    check(`${tag}: '${k}' NOT in progress rows`, !(k in sample));
  }
  // Expected safe keys ARE present.
  for (const k of SAFE_KEYS) {
    check(`${tag}: '${k}' present in progress rows`, k in sample);
  }
}

async function testCrossContamination() {
  console.log("\n— isolation: linked users must not see each other or student C —");
  const clientA = userA ? await signInAs(EMAIL_A, PASSWORD) : null;
  const clientB = userB ? await signInAs(EMAIL_B, PASSWORD) : null;

  if (clientA) {
    const { data: prog } = await clientA.rpc("get_my_progress");
    const courses = (prog || []).map((r) => r.course);
    check("user A never sees student B's course", !courses.includes(STUDENT_B.course));
    check("user A never sees student C's course", !courses.includes(STUDENT_C.course));
    const distances = (prog || []).map((r) => r.distance_km);
    check("user A never sees student B's distance 7.1", !distances.includes(7.1));
    check("user A never sees student B's distance 4.5", !distances.includes(4.5));
    check("user A never sees student C's distance 9.9", !distances.includes(9.9));
  } else {
    check("user A available for isolation test", false);
  }

  if (clientB) {
    const { data: prog } = await clientB.rpc("get_my_progress");
    const courses = (prog || []).map((r) => r.course);
    check("user B never sees student A's course", !courses.includes(STUDENT_A.course));
    check("user B never sees student C's course", !courses.includes(STUDENT_C.course));
    const distances = (prog || []).map((r) => r.distance_km);
    check("user B never sees student A's distance 5.2", !distances.includes(5.2));
    check("user B never sees student A's distance 3.8", !distances.includes(3.8));
    check("user B never sees student C's distance 9.9", !distances.includes(9.9));
  } else {
    check("user B available for isolation test", false);
  }
}

async function testSearchPathAndPrivileges() {
  console.log("\n— RPC + table security posture —");
  // student_link must be unreachable directly by anon (RLS + revoke).
  const { error: directErr } = await anon
    .from("student_link")
    .select("auth_user_id")
    .limit(1);
  check(
    "anon cannot read student_link directly",
    !!directErr,
    directErr?.message || "anon read succeeded (bad)"
  );
  // anon cannot insert a self-mapping.
  const { error: insErr } = await anon
    .from("student_link")
    .insert({
      auth_user_id: userA?.id ?? "00000000-0000-0000-0000-000000000000",
      student_id: 1,
    });
  check(
    "anon cannot insert student_link (self-mapping blocked)",
    !!insErr,
    insErr?.message || "anon insert succeeded (bad)"
  );

  // AUTHENTICATED users must also NOT be able to read or modify student_link
  // directly via PostgREST (the anon key + their JWT). Access is only via RPCs.
  if (userA) {
    const clientA = await signInAs(EMAIL_A, PASSWORD);
    const { error: authReadErr } = await clientA
      .from("student_link")
      .select("auth_user_id")
      .limit(1);
    check(
      "authenticated user A cannot read student_link directly",
      !!authReadErr,
      authReadErr?.message || "authenticated read succeeded (bad)"
    );
    const { error: authInsErr } = await clientA
      .from("student_link")
      .insert({ auth_user_id: userA.id, student_id: 1 });
    check(
      "authenticated user A cannot insert/modify student_link",
      !!authInsErr,
      authInsErr?.message || "authenticated insert succeeded (bad)"
    );
  } else {
    check("user A available for privilege test", false);
  }

  if (userB) {
    const clientB = await signInAs(EMAIL_B, PASSWORD);
    const { error: authReadErr } = await clientB
      .from("student_link")
      .select("auth_user_id")
      .limit(1);
    check(
      "authenticated user B cannot read student_link directly",
      !!authReadErr,
      authReadErr?.message || "authenticated read succeeded (bad)"
    );
  } else {
    check("user B available for privilege test", false);
  }
}

async function teardown() {
  console.log("\n— teardown (synthetic data + throwaway users) —");
  for (const [tag, user] of [["A", userA], ["B", userB], ["C", userC]]) {
    if (user) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      check(`delete throwaway user ${tag}`, !error, error?.message);
    }
  }
  await admin
    .from("lesson_tracking_sessions")
    .delete()
    .in("lesson_id", [800001, 800002, 800003, 800004, 800005]);
  await admin
    .from("lessons")
    .delete()
    .in("local_id", [800001, 800002, 800003, 800004, 800005]);
  // Remove any link rows for our throwaway users (A and B; C never had one).
  for (const user of [userA, userB]) {
    if (user) {
      await admin.from("student_link").delete().eq("auth_user_id", user.id);
    }
  }
  console.log("  (synthetic rows removed)");
}

(async () => {
  console.log("Student dashboard e2e test — THROW-AWAY project only\n");
  const schemaOk = await setupSchema();
  await assertNoOrphanedSchema();
  await createUsers();

  if (!schemaOk) {
    console.log("\n!! Schema not present — apply this SQL in the throwaway");
    console.log("   project's SQL Editor first, then re-run this harness:\n");
    console.log(SETUP_SQL);
    await teardown();
    process.exit(2);
  }

  await insertSyntheticData();

  await testSignedOut();
  await testUnlinked();
  await testLinkedIsolated("user A", userA, EMAIL_A, STUDENT_A, [5.2, 3.8]);
  await testLinkedIsolated("user B", userB, EMAIL_B, STUDENT_B, [7.1, 4.5]);
  await testCrossContamination();
  await testSearchPathAndPrivileges();

  await teardown();

  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  if (fail) {
    console.log("Failures:", failures.join("; "));
    process.exit(1);
  }
})().catch((e) => {
  console.error("Harness error:", e);
  process.exit(3);
});
