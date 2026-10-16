// =============================================================================
// Integration test: slot-booking endpoint + submit_slot_booking RPC.
// Run ONLY after migrations 003 + 004 are applied in Supabase.
//   node scripts/test-slot-booking.mjs
//
// Tests: validation (missing fields), course + pick&drop flow, server error path.
// The valid-booking tests insert real rows into booking_requests and report
// the booking id. They do NOT delete the row (you may clean them up manually).
// =============================================================================

const ENDPOINT = "https://raziadrivingcenter.com/api/v1/slot-booking";

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

async function post(payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* raw text */ }
  return { status: res.status, json, text };
}

async function run() {
  console.log("=== Slot Booking Endpoint Tests ===\n");

  // 1. Valid booking (name + phone + slot only — back-compat)
  console.log("Test 1: valid booking (minimal)");
  const r1 = await post({
    customer_name: "Test Diagnostic",
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r1.status}`, r1.json || r1.text);
  check("returns 201", r1.status === 201, `got ${r1.status}`);
  check("has bookingId", !!r1.json?.bookingId && r1.json.bookingId !== "N/A", r1.json?.bookingId);
  check("status is pending", r1.json?.status === "pending");
  check("has whatsappLink", typeof r1.json?.whatsappLink === "string" && r1.json.whatsappLink.startsWith("https://wa.me/"));

  // 2. Valid booking with course + pick&drop (migration 004 fields)
  console.log("\nTest 2: valid booking with course + pick&drop");
  const r2 = await post({
    customer_name: "Test Full",
    customer_phone: "3009876543",
    preferred_date: "2026-11-02",
    preferred_time: "14:00",
    course: "Economy Driving Course",
    home_service: true,
    distance_km: 8,
    address: "123 Model Town, Lahore",
  });
  console.log(`  HTTP ${r2.status}`, r2.json || r2.text);
  check("returns 201", r2.status === 201, `got ${r2.status}`);
  check("has bookingId", !!r2.json?.bookingId && r2.json.bookingId !== "N/A", r2.json?.bookingId);
  check("whatsappLink mentions course", typeof r2.json?.whatsappLink === "string" && r2.json.whatsappLink.includes("Course"));

  // 3. Missing name
  console.log("\nTest 3: missing name");
  const r3 = await post({
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r3.status}`, r3.json || r3.text);
  check("returns 400", r3.status === 400, `got ${r3.status}`);

  // 4. Missing phone
  console.log("\nTest 4: missing phone");
  const r4 = await post({
    customer_name: "No Phone",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r4.status}`, r4.json || r4.text);
  check("returns 400", r4.status === 400, `got ${r4.status}`);

  // 5. Invalid date format
  console.log("\nTest 5: invalid date");
  const r5 = await post({
    customer_name: "Bad Date",
    customer_phone: "3001234567",
    preferred_date: "11-01-2026",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r5.status}`, r5.json || r5.text);
  check("returns 400", r5.status === 400, `got ${r5.status}`);

  // 6. Pick & Drop requires address + distance
  console.log("\nTest 6: pick&drop missing address");
  const r6 = await post({
    customer_name: "No Address",
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
    home_service: true,
    distance_km: 5,
  });
  console.log(`  HTTP ${r6.status}`, r6.json || r6.text);
  check("returns 400", r6.status === 400, `got ${r6.status}`);

  // 7. Pick & Drop distance over 20 KM rejected
  console.log("\nTest 7: pick&drop distance > 20");
  const r7 = await post({
    customer_name: "Too Far",
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
    home_service: true,
    distance_km: 25,
    address: "Far away place",
  });
  console.log(`  HTTP ${r7.status}`, r7.json || r7.text);
  check("returns 400", r7.status === 400, `got ${r7.status}`);

  // 8. Wrong method
  console.log("\nTest 8: GET (wrong method)");
  const r8 = await fetch(ENDPOINT);
  console.log(`  HTTP ${r8.status}`);
  check("returns 405", r8.status === 405, `got ${r8.status}`);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
