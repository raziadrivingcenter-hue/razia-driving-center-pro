// =============================================================================
// Handler-level regression tests for the 07:00–19:00 operating-hours
// reconciliation. Exercises the real Cloudflare Pages Function handlers
// (slot-booking.js, bookings.js) with mocked request/environment and a mocked
// global fetch — NO network, NO Supabase, NO credentials.
//
//   node --test scripts/test-booking-handlers.mjs
//   (also wired as `npm run test:booking-handlers`)
// =============================================================================

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { onRequest as slotBookingOnRequest } from "../functions/api/v1/slot-booking.js";
import { onRequest as bookingsOnRequest } from "../functions/api/v1/bookings.js";

// The Own-Vehicle pricing engine exists twice by design: the browser copy and
// the Cloudflare Functions mirror. The equality test below proves they agree.
import * as clientPricing from "../src/lib/ownVehiclePricing.js";
import * as serverPricing from "../functions/lib/ownVehiclePricing.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

// A fake Request-like object: just what the handlers touch (method, url, json()).
function mockRequest({ method = "POST", url = "https://example.com/", body }) {
  return {
    method,
    url,
    json: async () => body,
    headers: { get: () => null },
  };
}

// A fake env with placeholder Supabase config (never actually reached on the
// validation-failure paths, which is exactly what most of these tests exercise).
const mockEnv = {
  VITE_SUPABASE_URL: "https://mock.supabase.co",
  VITE_SUPABASE_ANON_KEY: "mock-anon-key",
};

// Record every fetch call so tests can assert the RPC/insert was NOT triggered
// on validation failure, and WAS triggered exactly once on the happy path.
let fetchCalls = [];

// Install a mock global fetch returning the given responses in order.
// If called more times than responses provided, throws (catches accidental
// happy-path execution when a test expects validation to reject first).
function mockFetch(responses = []) {
  fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    if (fetchCalls.length >= responses.length) {
      throw new Error(
        `fetch called ${fetchCalls.length + 1}x but only ${responses.length} responses queued — ` +
        `validation should have rejected before the upstream call. URL: ${url}`
      );
    }
    fetchCalls.push({ url, init });
    return responses[fetchCalls.length - 1];
  };
}

// Minimal Response helpers (Node 18+ global Response is available, but these
// keep the mock bodies explicit).
function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// The slot-booking RPC returns a raw UUID string.
function uuidResponse(uuid) {
  return new Response(`"${uuid}"`, { status: 200 });
}

// Restore after each test to keep the global clean.
function clearFetch() {
  delete globalThis.fetch;
}

// =============================================================================
// slot-booking.js
// =============================================================================

describe("slot-booking.js — operating-hours validation", () => {
  const validBody = {
    customer_name: "Test User",
    customer_phone: "3001234567",
    preferred_date: "2026-11-01",
    preferred_time: "10:00",
  };

  test("rejects 19:00 (would run past 19:00 closing) with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "19:00" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400, "expected 400");
    const body = await res.json();
    assert.equal(body.error, "Validation failed");
    assert.ok(
      body.details.some((d) => /no later than 18:30/.test(d)),
      `expected a 18:30-boundary error, got: ${JSON.stringify(body.details)}`
    );
    assert.equal(fetchCalls.length, 0, "must not call Supabase on validation failure");
    clearFetch();
  });

  test("rejects a time before 07:00 opening (06:00) with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "06:00" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(
      body.details.some((d) => /at or after 07:00/.test(d)),
      `expected a 07:00-opening error, got: ${JSON.stringify(body.details)}`
    );
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects an off-30-minute-grid time (07:15) with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "07:15" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(
      body.details.some((d) => /hour or half-hour/.test(d)),
      `expected a boundary error, got: ${JSON.stringify(body.details)}`
    );
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects a malformed time string (abc) with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "abc" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(
      body.details.some((d) => /HH:MM/.test(d)),
      `expected a format error, got: ${JSON.stringify(body.details)}`
    );
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("still rejects a missing preferred_time with 400 (pre-existing behavior)", async () => {
    mockFetch([]);
    const { preferred_time, ...bodyWithoutTime } = validBody;
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: bodyWithoutTime }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /Preferred time is required/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("accepts valid 18:30 (last bookable start) and reaches the mocked RPC", async () => {
    // Two upstream calls: the slot_availability pre-check, then the RPC.
    mockFetch([
      jsonResponse([{ slot_start: "18:30", status: "available" }], 200),
      uuidResponse("11111111-2222-3333-4444-555555555555"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "18:30" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "18:30 must be accepted");
    const body = await res.json();
    assert.equal(body.status, "pending");
    assert.equal(body.bookingId, "11111111");
    assert.ok(typeof body.whatsappLink === "string" && body.whatsappLink.startsWith("https://wa.me/"));
    assert.equal(fetchCalls.length, 2, "pre-check + RPC must be called exactly twice");
    // A normal available slot keeps the original RPC and carries no extra metadata.
    assert.match(fetchCalls[1].url, /\/rpc\/submit_slot_booking$/);
    assert.equal(JSON.parse(fetchCalls[1].init.body).p_extra, undefined);
    clearFetch();
  });

  test("accepts 07:00 (opening boundary) and reaches the mocked RPC", async () => {
    mockFetch([
      jsonResponse([{ slot_start: "07:00", status: "available" }], 200),
      uuidResponse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "07:00" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "07:00 must be accepted");
    assert.equal(fetchCalls.length, 2);
    clearFetch();
  });

  test("OPTIONS returns 204 with CORS headers (pre-existing behavior)", async () => {
    const res = await slotBookingOnRequest({
      request: { method: "OPTIONS", url: "https://example.com/", headers: { get: () => null } },
      env: mockEnv,
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    assert.equal(res.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
    clearFetch();
  });

  test("wrong method (GET) returns 405 (pre-existing behavior)", async () => {
    const res = await slotBookingOnRequest({
      request: mockRequest({ method: "GET", body: {} }),
      env: mockEnv,
    });
    assert.equal(res.status, 405);
    clearFetch();
  });

  test("success response has Cache-Control: no-store (pre-existing behavior)", async () => {
    mockFetch([
      jsonResponse([{ slot_start: "12:30", status: "available" }], 200),
      uuidResponse("99999999-8888-7777-6666-555555555555"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "12:30" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    clearFetch();
  });
});

// =============================================================================
// slot-booking.js — area-specific travel slots
// =============================================================================

describe("slot-booking.js — area-specific travel slots", () => {
  const travelBody = {
    customer_name: "Travel Test",
    customer_phone: "3001234567",
    preferred_date: "2026-11-10",
    preferred_time: "14:00",
    area: "Shadman",
  };

  const travelGoingRow = {
    slot_start: "14:00",
    status: "blocked",
    vehicle_id: 3,
    vehicle_name: "Toyota Corolla",
    block_reason: "travel_going",
    area: "Shadman",
  };

  test("matching travel_going area becomes bookable and persists extra via the metadata RPC", async () => {
    mockFetch([
      jsonResponse([travelGoingRow], 200),
      uuidResponse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "matching travel_going slot must be bookable");
    assert.equal(fetchCalls.length, 2);
    assert.match(fetchCalls[1].url, /\/rpc\/submit_slot_booking_with_metadata$/);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_area, "Shadman");
    assert.deepEqual(payload.p_extra, {
      vehicle_id: 3,
      vehicle_name: "Toyota Corolla",
      slot_date: "2026-11-10",
      slot_start: "14:00",
      booking_type: "area_travel",
      travel_area: "Shadman",
      promo_requested: null,
    });
    clearFetch();
  });

  test("area matching is case-insensitive and whitespace-normalized", async () => {
    mockFetch([
      jsonResponse([{ ...travelGoingRow, area: "  SHADMAN  " }], 200),
      uuidResponse("11111111-2222-3333-4444-555555555555"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...travelBody, area: "shadman" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.vehicle_id, 3);
    assert.equal(payload.p_extra.travel_area, "SHADMAN");
    clearFetch();
  });

  test("does NOT alias 'Shadman' with 'Shadman 1' — mismatched area is rejected", async () => {
    mockFetch([jsonResponse([{ ...travelGoingRow, area: "Shadman 1" }], 200)]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /Shadman 1/);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC on an area mismatch");
    clearFetch();
  });

  test("matching travel_returning area becomes bookable via the metadata RPC", async () => {
    mockFetch([
      jsonResponse([{ ...travelGoingRow, block_reason: "travel_returning" }], 200),
      uuidResponse("cccccccc-dddd-eeee-ffff-000000000000"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "matching travel_returning slot must be bookable");
    assert.equal(fetchCalls.length, 2);
    assert.match(fetchCalls[1].url, /\/rpc\/submit_slot_booking_with_metadata$/);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.vehicle_id, 3);
    assert.equal(payload.p_extra.travel_area, "Shadman");
    clearFetch();
  });

  test("promo is derived server-side from the matched tile's promo_percent/promo_area", async () => {
    mockFetch([
      jsonResponse(
        [{ ...travelGoingRow, promo_percent: 10, promo_area: "Shadman" }],
        200
      ),
      uuidResponse("dddddddd-eeee-ffff-0000-111111111111"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.promo_requested, 10);
    clearFetch();
  });

  test("promo is derived for a travel_returning tile too", async () => {
    mockFetch([
      jsonResponse(
        [
          {
            ...travelGoingRow,
            block_reason: "travel_returning",
            promo_percent: 8,
            promo_area: "Shadman",
          },
        ],
        200
      ),
      uuidResponse("eeeeeeee-ffff-0000-1111-222222222222"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.promo_requested, 8);
    clearFetch();
  });

  test("promo is NOT applied when the tile's promo_area does not match the request area", async () => {
    mockFetch([
      jsonResponse(
        [{ ...travelGoingRow, promo_percent: 10, promo_area: "Model Town" }],
        200
      ),
      uuidResponse("ffffffff-0000-1111-2222-333333333333"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.promo_requested, null);
    clearFetch();
  });

  test("promo is NOT applied when the tile carries no promo_area", async () => {
    mockFetch([
      jsonResponse([{ ...travelGoingRow, promo_percent: 10 }], 200),
      uuidResponse("99999999-1111-2222-3333-444444444444"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.promo_requested, null);
    clearFetch();
  });

  test("a browser-supplied promo_percent is ignored (server derives the value)", async () => {
    mockFetch([
      jsonResponse(
        [{ ...travelGoingRow, promo_percent: 10, promo_area: "Shadman" }],
        200
      ),
      uuidResponse("abababab-cdef-1234-5678-9abcdef01234"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: { ...travelBody, promo_percent: 99, promo_requested: 99 },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.promo_requested, 10);
    clearFetch();
  });

  test("availability lookup failure fails closed (503) and never books", async () => {
    // A failed pre-check must not fall through to the RPC: the RPCs do not
    // re-check availability, so proceeding would book an unverified slot.
    mockFetch([new Response("upstream error", { status: 500 })]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.match(body.error, /could not verify/i);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC on a lookup failure");
    clearFetch();
  });

  test("normal available slot still uses the original RPC (no extra)", async () => {
    mockFetch([
      jsonResponse([{ slot_start: "14:00", status: "available" }], 200),
      uuidResponse("22222222-3333-4444-5555-666666666666"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    assert.match(fetchCalls[1].url, /\/rpc\/submit_slot_booking$/);
    assert.equal(JSON.parse(fetchCalls[1].init.body).p_extra, undefined);
    clearFetch();
  });

  test("never trusts a browser-supplied vehicle_id", async () => {
    mockFetch([
      jsonResponse([travelGoingRow], 200),
      uuidResponse("33333333-4444-5555-6666-777777777777"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...travelBody, vehicle_id: 999 } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.vehicle_id, 3, "must use the server-derived vehicle");
    clearFetch();
  });

  test("missing metadata RPC fails safe with a clear upgrade-required message", async () => {
    const notFound = new Response(
      JSON.stringify({
        code: "PGRST202",
        message:
          "Could not find the function public.submit_slot_booking_with_metadata in the schema cache",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
    mockFetch([jsonResponse([travelGoingRow], 200), notFound]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: travelBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.match(body.error, /upgrade/i);
    clearFetch();
  });

  test("verified dashboard travel booking uses the verified metadata RPC with email", async () => {
    mockFetch([
      jsonResponse(
        { email: "student@example.com", email_confirmed_at: "2026-01-01T00:00:00Z" },
        200
      ),
      jsonResponse([travelGoingRow], 200),
      uuidResponse("44444444-5555-6666-7777-888888888888"),
    ]);
    const res = await slotBookingOnRequest({
      request: {
        method: "POST",
        url: "https://example.com/",
        json: async () => travelBody,
        headers: { get: () => "Bearer valid-token" },
      },
      env: { ...mockEnv, SUPABASE_SERVICE_ROLE_KEY: "mock-service-key" },
    });
    assert.equal(res.status, 201);
    assert.equal(fetchCalls.length, 3, "auth lookup + pre-check + RPC");
    assert.match(
      fetchCalls[2].url,
      /\/rpc\/submit_slot_booking_with_metadata_verified$/
    );
    const payload = JSON.parse(fetchCalls[2].init.body);
    assert.equal(payload.p_customer_email, "student@example.com");
    assert.equal(payload.p_extra.vehicle_id, 3);
    clearFetch();
  });
});

// =============================================================================
// slot-booking.js — advance-booked tiles
// =============================================================================

describe("slot-booking.js — advance-booked tiles", () => {
  const advanceBody = {
    customer_name: "Advance Test",
    customer_phone: "3001234567",
    preferred_date: "2026-11-12",
    preferred_time: "14:00",
    area: "Shadman",
  };

  const advanceRow = {
    slot_start: "14:00",
    status: "blocked",
    vehicle_id: 9007,
    vehicle_name: "Toyota Corolla",
    block_reason: "advance_booked",
    area: "Shadman",
  };

  test("rejects an advance_booked tile with 409 and never reaches the RPC", async () => {
    mockFetch([jsonResponse([advanceRow], 200)]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: advanceBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409, "advance_booked must be rejected");
    const body = await res.json();
    assert.match(body.error, /booked in advance/i);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC for an advance tile");
    clearFetch();
  });

  test("rejects an advance_booked tile for ANY area (and with no area)", async () => {
    // The rejection is keyed on block_reason only — it must not depend on the
    // visitor's selected area. One pre-check response per request.
    for (const area of ["Shadman", "DHA", ""]) {
      mockFetch([jsonResponse([advanceRow], 200)]);
      const res = await slotBookingOnRequest({
        request: mockRequest({ body: { ...advanceBody, area } }),
        env: mockEnv,
      });
      assert.equal(res.status, 409, `area "${area}" must still be rejected`);
      assert.equal(fetchCalls.length, 1, "must not reach the RPC");
      clearFetch();
    }
  });

  test("rejects an advance_booked tile even when another vehicle is available", async () => {
    // The website UI gives an advance_booked row priority over an available
    // row (the desktop publishes one row per tile), so the server must reject
    // the slot too — otherwise a forged request could claim a tile the
    // visitor is shown as disabled.
    mockFetch([
      jsonResponse(
        [
          advanceRow,
          { slot_start: "14:00", status: "available", vehicle_id: 42 },
        ],
        200
      ),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: advanceBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC");
    clearFetch();
  });

  test("advance tile with available_in_days set is still rejected (column is irrelevant)", async () => {
    mockFetch([
      jsonResponse([{ ...advanceRow, available_in_days: 3 }], 200),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: advanceBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409);
    assert.equal(fetchCalls.length, 1);
    clearFetch();
  });
});

// =============================================================================
// bookings.js
// =============================================================================

describe("bookings.js — operating-hours validation", () => {
  const validBody = {
    customer_name: "Test User",
    phone_number: "3001234567",
    plan_type: "plus",
  };

  test("rejects invalid slot_time (19:00) when supplied, with 400", async () => {
    mockFetch([]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: { ...validBody, slot_time: "19:00" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Validation failed");
    assert.ok(
      body.details.some((d) => /no later than 18:30/.test(d)),
      `expected a 18:30-boundary error, got: ${JSON.stringify(body.details)}`
    );
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects off-grid slot_time (10:20) when supplied, with 400", async () => {
    mockFetch([]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: { ...validBody, slot_time: "10:20" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /hour or half-hour/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects malformed slot_time (abc) when supplied, with 400", async () => {
    mockFetch([]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: { ...validBody, slot_time: "abc" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /HH:MM/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("preserves optional slot_time — omitted field still succeeds (201, mocked insert)", async () => {
    mockFetch([jsonResponse([{ id: 42 }], 200)]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: validBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "omitting slot_time must remain valid");
    const body = await res.json();
    assert.equal(body.status, "pending");
    assert.equal(body.bookingId, "42");
    assert.equal(fetchCalls.length, 1);
    clearFetch();
  });

  test("accepts valid slot_time (18:30) when supplied (201, mocked insert)", async () => {
    mockFetch([jsonResponse([{ id: 7 }], 200)]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: { ...validBody, slot_time: "18:30" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "18:30 must be accepted");
    assert.equal(fetchCalls.length, 1);
    clearFetch();
  });

  test("OPTIONS returns 204 with CORS headers (pre-existing behavior)", async () => {
    const res = await bookingsOnRequest({
      request: { method: "OPTIONS", url: "https://example.com/", headers: { get: () => null } },
      env: mockEnv,
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    clearFetch();
  });

  test("wrong method (GET) returns 405 (pre-existing behavior)", async () => {
    const res = await bookingsOnRequest({
      request: mockRequest({ method: "GET", body: {} }),
      env: mockEnv,
    });
    assert.equal(res.status, 405);
    clearFetch();
  });

  test("success response has Cache-Control: no-store (pre-existing behavior)", async () => {
    mockFetch([jsonResponse([{ id: 1 }], 200)]);
    const res = await bookingsOnRequest({
      request: mockRequest({ body: validBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    clearFetch();
  });
});

// =============================================================================
// Own-Vehicle pricing — browser module vs Cloudflare mirror
// =============================================================================

describe("own-vehicle pricing — browser module vs Cloudflare mirror", () => {
  test("both copies produce identical prices over the whole input grid", () => {
    for (let days = 7; days <= 30; days += 1) {
      for (const minutes of [30, 40, 50, 60]) {
        for (const km of [0, 0.5, 1, 5, 8, 12.5, 20, 21, 40]) {
          for (const homeService of [true, false]) {
            const label = `days=${days} minutes=${minutes} km=${km} homeService=${homeService}`;
            assert.equal(
              clientPricing.perDayPrice(minutes),
              serverPricing.perDayPrice(minutes),
              `perDayPrice mismatch (${label})`
            );
            assert.equal(
              clientPricing.courseFee(days, minutes),
              serverPricing.courseFee(days, minutes),
              `courseFee mismatch (${label})`
            );
            assert.equal(
              clientPricing.pickDropCharge(days, km),
              serverPricing.pickDropCharge(days, km),
              `pickDropCharge mismatch (${label})`
            );
            assert.equal(
              clientPricing.total(days, minutes, km, homeService),
              serverPricing.total(days, minutes, km, homeService),
              `total mismatch (${label})`
            );
          }
        }
      }
    }
  });

  test("both copies clamp and validate identically", () => {
    for (const d of [0, 6, 7, 10, 30, 31, 100, -5, NaN]) {
      assert.equal(clientPricing.clampDays(d), serverPricing.clampDays(d), `clampDays(${d})`);
    }
    for (const m of [0, 29, 30, 45, 60, 61, 120, -10, NaN]) {
      assert.equal(
        clientPricing.clampMinutes(m),
        serverPricing.clampMinutes(m),
        `clampMinutes(${m})`
      );
    }
    for (const km of [-5, 0, 8, 20, 21, 999, NaN]) {
      assert.equal(
        clientPricing.clampDistanceKm(km),
        serverPricing.clampDistanceKm(km),
        `clampDistanceKm(${km})`
      );
    }

    for (const input of [
      { days: 6, minutes: 40, distanceKm: 8, homeService: true },
      { days: 31, minutes: 40, distanceKm: 8, homeService: true },
      { days: 10, minutes: 45, distanceKm: 8, homeService: true },
      { days: 10, minutes: 40, distanceKm: 21, homeService: true },
      { days: 10, minutes: 40, distanceKm: 0, homeService: true },
      { days: 10, minutes: 40, distanceKm: 8, homeService: false },
      { days: 10, minutes: 40, distanceKm: 0, homeService: false },
    ]) {
      assert.deepEqual(
        clientPricing.validate(input),
        serverPricing.validate(input),
        `validate(${JSON.stringify(input)})`
      );
    }
  });
});

// =============================================================================
// slot-booking.js — Own-Vehicle course bookings
// =============================================================================

describe("slot-booking.js — own-vehicle course bookings", () => {
  const ownVehicleExtra = {
    booking_type: "own_vehicle",
    course_days: 10,
    lesson_minutes: 40,
    tiles_needed: 2,
    transmission: "Automatic",
    gender: "Male",
    instructor_preference: "Female",
    adult_confirmed: true,
  };

  const ownVehicleBody = {
    customer_name: "Owais Khan",
    customer_phone: "03001234567",
    preferred_date: "2026-11-20",
    preferred_time: "10:00",
    course: "Own Vehicle Course",
    home_service: false,
    address: "",
    distance_km: 0,
    extra: ownVehicleExtra,
  };

  // A 40-minute lesson occupies 10:00 and 10:30 on the SAME vehicle.
  const twoTilesSameVehicle = [
    { slot_start: "10:00", status: "available", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
    { slot_start: "10:30", status: "available", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
  ];

  test("happy path stores the course metadata and the server-recomputed price", async () => {
    mockFetch([
      jsonResponse(twoTilesSameVehicle, 200),
      uuidResponse("abcdef12-3456-7890-abcd-ef1234567890"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: ownVehicleBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    assert.equal(fetchCalls.length, 2, "pre-check + RPC");
    assert.match(fetchCalls[1].url, /\/rpc\/submit_slot_booking_with_metadata$/);

    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_preferred_course, "Own Vehicle Course");
    assert.equal(payload.p_area, null, "own-vehicle bookings never send an area");
    assert.equal(payload.p_home_service, false);
    assert.equal(payload.p_distance_km, 0);
    assert.deepEqual(payload.p_extra, {
      booking_type: "own_vehicle",
      course_days: 10,
      lesson_minutes: 40,
      tiles_needed: 2,
      transmission: "Automatic",
      gender: "Male",
      instructor_preference: "Female",
      adult_confirmed: true,
      estimated_total: 10700,
      course_fee: 10700,
      pickdrop_charge: 0,
      vehicle_id: 7,
      vehicle_name: "Toyota Corolla",
      slot_date: "2026-11-20",
      slot_start: "10:00",
      promo_requested: null,
      summary: "10 days, 40 min, Automatic, Male, Female instructor",
    });
    clearFetch();
  });

  test("request payload shape for a 10-day / 40-min / 8-km booking", async () => {
    mockFetch([
      jsonResponse(twoTilesSameVehicle, 200),
      uuidResponse("12345678-90ab-cdef-1234-567890abcdef"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          home_service: true,
          address: "28/A S Block Gulberg 2, Lahore",
          distance_km: 8,
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_home_service, true);
    assert.equal(payload.p_distance_km, 8);
    assert.equal(payload.p_address, "28/A S Block Gulberg 2, Lahore");
    assert.equal(payload.p_extra.course_days, 10);
    assert.equal(payload.p_extra.lesson_minutes, 40);
    assert.equal(payload.p_extra.tiles_needed, 2);
    assert.equal(payload.p_extra.course_fee, 10700);
    assert.equal(payload.p_extra.pickdrop_charge, 10400);
    assert.equal(payload.p_extra.estimated_total, 21100);
    assert.equal(
      payload.p_extra.summary,
      "10 days, 40 min, Automatic, Male, Female instructor"
    );
    clearFetch();
  });

  test("a 30-minute lesson only needs the start tile", async () => {
    mockFetch([
      jsonResponse(
        [
          {
            slot_start: "10:00",
            status: "available",
            vehicle_id: 7,
            vehicle_name: "Toyota Corolla",
          },
        ],
        200
      ),
      uuidResponse("77777777-6666-5555-4444-333333333333"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          extra: { ...ownVehicleExtra, lesson_minutes: 30, tiles_needed: 1 },
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.tiles_needed, 1);
    assert.equal(payload.p_extra.estimated_total, 8000, "10 days x Rs. 800 (half of the 60-min day)");
    clearFetch();
  });

  test("rejects a 6-day course with 400 and never reaches Supabase", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: { ...ownVehicleBody, extra: { ...ownVehicleExtra, course_days: 6 } },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /7 and 30 days/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects a 31-day course with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: { ...ownVehicleBody, extra: { ...ownVehicleExtra, course_days: 31 } },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /7 and 30 days/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects a 45-minute lesson with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          extra: { ...ownVehicleExtra, lesson_minutes: 45 },
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /30, 40, 50 or 60 minutes/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects a 21 km pick & drop distance with 400", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          home_service: true,
          address: "28/A S Block Gulberg 2, Lahore",
          distance_km: 21,
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /up to 20 KM/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects a booking that does not confirm the visitor is 18 or older", async () => {
    mockFetch([]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          extra: { ...ownVehicleExtra, adult_confirmed: false },
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.some((d) => /18 or older/.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("rejects an unknown gender, transmission or instructor preference", async () => {
    for (const [field, value, pattern] of [
      ["gender", "Other", /valid gender/],
      ["transmission", "CVT", /valid transmission/],
      ["instructor_preference", "Any", /valid instructor preference/],
    ]) {
      mockFetch([]);
      const res = await slotBookingOnRequest({
        request: mockRequest({
          body: { ...ownVehicleBody, extra: { ...ownVehicleExtra, [field]: value } },
        }),
        env: mockEnv,
      });
      assert.equal(res.status, 400, `${field}=${value} must be rejected`);
      const body = await res.json();
      assert.ok(
        body.details.some((d) => pattern.test(d)),
        `${field}=${value} expected a validation message`
      );
      assert.equal(fetchCalls.length, 0);
      clearFetch();
    }
  });

  test("rejects a missing name or phone on an own-vehicle booking", async () => {
    for (const field of ["customer_name", "customer_phone"]) {
      mockFetch([]);
      const body = { ...ownVehicleBody };
      delete body[field];
      const res = await slotBookingOnRequest({
        request: mockRequest({ body }),
        env: mockEnv,
      });
      assert.equal(res.status, 400, `missing ${field} must be rejected`);
      assert.equal(fetchCalls.length, 0);
      clearFetch();
    }
  });

  test("rejects pick & drop without an address or a distance", async () => {
    // Address missing.
    mockFetch([]);
    let res = await slotBookingOnRequest({
      request: mockRequest({
        body: { ...ownVehicleBody, home_service: true, distance_km: 8 },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    let body = await res.json();
    assert.ok(body.details.some((d) => /address is required/i.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();

    // Distance missing.
    mockFetch([]);
    res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          home_service: true,
          address: "28/A S Block Gulberg 2, Lahore",
          distance_km: 0,
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 400);
    body = await res.json();
    assert.ok(body.details.some((d) => /Distance is required/i.test(d)));
    assert.equal(fetchCalls.length, 0);
    clearFetch();
  });

  test("ignores a price tampered in the request body", async () => {
    mockFetch([
      jsonResponse(twoTilesSameVehicle, 200),
      uuidResponse("99999999-8888-7777-6666-555555555555"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({
        body: {
          ...ownVehicleBody,
          home_service: true,
          address: "28/A S Block Gulberg 2, Lahore",
          distance_km: 8,
          // All of these must be ignored — the server recomputes the price.
          total: 1,
          course_fee: 1,
          pickdrop_charge: 1,
          extra: {
            ...ownVehicleExtra,
            course_fee: 1,
            pickdrop_charge: 1,
            estimated_total: 1,
          },
        },
      }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.estimated_total, 21100);
    assert.equal(payload.p_extra.course_fee, 10700);
    assert.equal(payload.p_extra.pickdrop_charge, 10400);
    clearFetch();
  });

  test("rejects with 409 when the second tile of the lesson is taken", async () => {
    mockFetch([
      jsonResponse(
        [
          { slot_start: "10:00", status: "available", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
          { slot_start: "10:30", status: "booked", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
        ],
        200
      ),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: ownVehicleBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /no longer available for the full lesson/i);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC");
    clearFetch();
  });

  test("rejects with 409 when the free tiles are split across two vehicles", async () => {
    mockFetch([
      jsonResponse(
        [
          { slot_start: "10:00", status: "available", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
          { slot_start: "10:30", status: "available", vehicle_id: 8, vehicle_name: "Honda City" },
        ],
        200
      ),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: ownVehicleBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 409);
    assert.equal(fetchCalls.length, 1);
    clearFetch();
  });

  test("accepts when another vehicle can host the whole lesson", async () => {
    mockFetch([
      jsonResponse(
        [
          { slot_start: "10:00", status: "available", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
          { slot_start: "10:30", status: "booked", vehicle_id: 7, vehicle_name: "Toyota Corolla" },
          { slot_start: "10:00", status: "available", vehicle_id: 9, vehicle_name: "Honda City" },
          { slot_start: "10:30", status: "available", vehicle_id: 9, vehicle_name: "Honda City" },
        ],
        200
      ),
      uuidResponse("88888888-7777-6666-5555-444444444444"),
    ]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: ownVehicleBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 201);
    const payload = JSON.parse(fetchCalls[1].init.body);
    assert.equal(payload.p_extra.vehicle_id, 9);
    assert.equal(payload.p_extra.vehicle_name, "Honda City");
    clearFetch();
  });

  test("availability lookup failure fails closed (503) and never books", async () => {
    mockFetch([new Response("upstream error", { status: 500 })]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: ownVehicleBody }),
      env: mockEnv,
    });
    assert.equal(res.status, 503);
    assert.equal(fetchCalls.length, 1, "must not reach the RPC");
    clearFetch();
  });
});
