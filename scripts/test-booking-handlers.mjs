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
    mockFetch([uuidResponse("11111111-2222-3333-4444-555555555555")]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "18:30" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "18:30 must be accepted");
    const body = await res.json();
    assert.equal(body.status, "pending");
    assert.equal(body.bookingId, "11111111");
    assert.ok(typeof body.whatsappLink === "string" && body.whatsappLink.startsWith("https://wa.me/"));
    assert.equal(fetchCalls.length, 1, "RPC must be called exactly once");
    clearFetch();
  });

  test("accepts 07:00 (opening boundary) and reaches the mocked RPC", async () => {
    mockFetch([uuidResponse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")]);
    const res = await slotBookingOnRequest({
      request: mockRequest({ body: { ...validBody, preferred_time: "07:00" } }),
      env: mockEnv,
    });
    assert.equal(res.status, 201, "07:00 must be accepted");
    assert.equal(fetchCalls.length, 1);
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
    mockFetch([uuidResponse("99999999-8888-7777-6666-555555555555")]);
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
