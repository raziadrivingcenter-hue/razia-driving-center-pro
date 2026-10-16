// =============================================================================
// Integration test: slot-booking endpoint + submit_slot_booking RPC.
// Run ONLY after migration 003 is applied in Supabase.
//   node scripts/test-slot-booking.mjs
//
// Tests: valid booking, validation (missing fields), server error path.
// The valid-booking test inserts a real row into booking_requests and reports
// the booking id. It does NOT delete the row (you may clean it up manually).
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

  // 1. Valid booking
  console.log("Test 1: valid booking");
  const r1 = await post({
    customer_name: "Test Diagnostic",
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r1.status}`, r1.json || r1.text);
  check("returns 201", r1.status === 201, `got ${r1.status}`);
  check("has bookingId", !!r1.json?.bookingId && r1.json.bookingId !== "N/A",
    r1.json?.bookingId);
  check("status is pending", r1.json?.status === "pending");
  check("has whatsappLink", typeof r1.json?.whatsappLink === "string" && r1.json.whatsappLink.startsWith("https://wa.me/"));

  // 2. Missing name
  console.log("\nTest 2: missing name");
  const r2 = await post({
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r2.status}`, r2.json || r2.text);
  check("returns 400", r2.status === 400, `got ${r2.status}`);

  // 3. Missing phone
  console.log("\nTest 3: missing phone");
  const r3 = await post({
    customer_name: "No Phone",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r3.status}`, r3.json || r3.text);
  check("returns 400", r3.status === 400, `got ${r3.status}`);

  // 4. Invalid date format
  console.log("\nTest 4: invalid date");
  const r4 = await post({
    customer_name: "Bad Date",
    customer_phone: "3001234567",
    preferred_date: "11-01-2026",
    preferred_time: "10:00",
  });
  console.log(`  HTTP ${r4.status}`, r4.json || r4.text);
  check("returns 400", r4.status === 400, `got ${r4.status}`);

  // 5. Wrong method
  console.log("\nTest 5: GET (wrong method)");
  const r5 = await fetch(ENDPOINT);
  console.log(`  HTTP ${r5.status}`);
  check("returns 405", r5.status === 405, `got ${r5.status}`);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
