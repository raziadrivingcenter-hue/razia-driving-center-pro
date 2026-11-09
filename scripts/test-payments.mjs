// =============================================================================
// Payment pipeline tests — no network, no Supabase, no credentials.
//
//   node --test scripts/test-payments.mjs
//   (also wired as `npm run test:payments`)
//
// Covers exactly the five behaviours asked for:
//   1. price is recalculated server-side, never taken from the browser
//   2. a duplicate webhook delivery does not double-confirm
//   3. a bad signature is rejected and changes nothing
//   4. an expired hold releases the slot / marks the booking expired
//   5. a manually-entered distance is refused for online payment
//
// The SQL in migration 011 (create_card_booking, expire_stale_card_bookings)
// is NOT exercised here — it needs a real Postgres. See the README note in
// the test output.
// =============================================================================

import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";

import { recalculatePrice, canPayOnline } from "../functions/payments/pricing.js";
import { isHoldActive, holdExpiryDate, BOOKING_PAYMENT_STATUS } from "../functions/payments/hold.js";
import { handleWebhook } from "../functions/payments/webhookPipeline.js";
import mockProvider from "../functions/payments/mock.js";
import { hmacSha256Hex } from "../functions/payments/signature.js";
import {
  getProvider,
  isMockPermitted,
  isProductionEnv,
} from "../functions/payments/provider.js";
import { onRequest as createSession } from "../functions/api/v1/payments/create-session.js";
import { onRequest as statusEndpoint } from "../functions/api/v1/payments/status.js";
import { onRequest as mockCheckout } from "../functions/api/v1/payments/mock-checkout.js";

const SECRET = "test-webhook-secret";

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockRequest({ method = "POST", url = "https://example.com/", body, auth = null }) {
  return {
    method,
    url,
    headers: { get: (name) => (name.toLowerCase() === "authorization" ? auth : null) },
    json: async () => body,
    text: async () => JSON.stringify(body ?? ""),
  };
}

/** In-memory stand-in for the service-role REST client. */
function memoryClient({ bookings = {}, holds = {}, events = [] } = {}) {
  const state = { bookings, holds, events };
  return {
    _state: state,
    async post(path, body) {
      assert.equal(path, "payment_events");
      if (state.events.some((e) => e.event_id === body.event_id)) return [];
      state.events.push(body);
      return [body];
    },
    async get(path) {
      if (path.startsWith("booking_requests")) {
        const id = decodeURIComponent(/id=eq\.([^&]+)/.exec(path)[1]);
        return state.bookings[id] ? [state.bookings[id]] : [];
      }
      if (path.startsWith("booking_slot_holds")) {
        const id = decodeURIComponent(/booking_id=eq\.([^&]+)/.exec(path)[1]);
        return state.holds[id] ? [state.holds[id]] : [];
      }
      return [];
    },
    async patch(path, body) {
      if (path.startsWith("booking_requests")) {
        const id = decodeURIComponent(/id=eq\.([^&]+)/.exec(path)[1]);
        if (state.bookings[id]) Object.assign(state.bookings[id], body);
        return [];
      }
      if (path.startsWith("booking_slot_holds")) {
        const id = decodeURIComponent(/booking_id=eq\.([^&]+)/.exec(path)[1]);
        if (state.holds[id]) Object.assign(state.holds[id], body);
        return [];
      }
      return [];
    },
  };
}

/** Build a signed mock webhook body. */
async function signedMockEvent({ eventId, bookingRef, status = "paid", amount = 17500 }) {
  const payload = {
    event_id: eventId,
    booking_ref: bookingRef,
    status,
    amount,
    currency: "PKR",
    provider_reference: `mock-txn-${eventId}`,
  };
  const body = JSON.stringify(payload);
  const signature = await hmacSha256Hex(SECRET, body);
  return { body, signature, payload };
}

// ---------------------------------------------------------------------------
// 1. Price is recalculated server-side
// ---------------------------------------------------------------------------

describe("server-side price recalculation", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function stubRoute(distanceMetres) {
    globalThis.fetch = async (url) => {
      if (String(url).includes("/route/v1/driving/")) {
        return jsonResponse({
          routes: [{ distance: distanceMetres, duration: 900 }],
        });
      }
      throw new Error(`Unexpected fetch in pricing test: ${url}`);
    };
  }

  test("derives the amount from the routed distance, not the browser", async () => {
    stubRoute(5000); // 5 km

    // 5 km, PLUS Plan (10 days), 2 km free → 3 × 50 × 10 × 2 = 3000
    const price = await recalculatePrice({
      pickup: { lat: 31.5, lng: 74.35 },
      courseId: "PLUS Plan",
    });

    assert.equal(price.ok, true);
    assert.equal(price.distanceKm, 5);
    assert.equal(price.distanceFee, 3000);
    assert.equal(price.courseFee, 14500);
    assert.equal(price.totalFee, 17500);
  });

  test("clamps to 20 KM and charges the course fee alone without pick & drop", async () => {
    stubRoute(99_000); // 99 km — far beyond the service area

    const clamped = await recalculatePrice({
      pickup: { lat: 31.5, lng: 74.35 },
      courseId: "Basic Plan",
    });
    assert.equal(clamped.distanceKm, 20);
    // 20 × 50 × 7 × 2 = 14000
    assert.equal(clamped.distanceFee, 14000);
    assert.equal(clamped.withinServiceArea, false);

    const noPickup = await recalculatePrice({ pickup: null, courseId: "Basic Plan" });
    assert.equal(noPickup.totalFee, 9999);
    assert.equal(noPickup.distanceFee, 0);
  });

  test("refuses a course it cannot price (Custom Course)", async () => {
    const price = await recalculatePrice({ pickup: null, courseId: "Custom Course" });
    assert.equal(price.ok, false);
    assert.match(price.error, /cannot be priced/);
  });

  test("create-session ignores a forged client distance_km", async () => {
    stubRoute(5000);
    const rpcCalls = [];
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.includes("/route/v1/driving/")) {
        return jsonResponse({ routes: [{ distance: 5000, duration: 900 }] });
      }
      if (u.includes("/rest/v1/slot_availability")) {
        return jsonResponse([
          { slot_start: "12:00", status: "available", vehicle_id: 1, area: null },
        ]);
      }
      if (u.includes("/rest/v1/rpc/create_card_booking")) {
        rpcCalls.push(JSON.parse(init.body));
        return new Response('"11111111-1111-1111-1111-111111111111"', { status: 200 });
      }
      if (u.includes("/rest/v1/booking_requests")) {
        return new Response("", { status: 204 });
      }
      throw new Error(`Unexpected fetch: ${u}`);
    };

    const res = await createSession({
      request: mockRequest({
        url: "https://example.com/api/v1/payments/create-session",
        body: {
          customer_name: "Test",
          customer_phone: "03000000000",
          preferred_date: "2026-11-20",
          preferred_time: "12:00",
          course: "PLUS Plan",
          home_service: true,
          address: "Test address",
          distance_source: "map",
          // Forged: the browser claims 20 km, which would be a different price.
          distance_km: 20,
          total_fee: 999999,
          pickup: { lat: 31.5, lng: 74.35 },
        },
      }),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        PAYMENT_PROVIDER: "mock",
        PAYMENTS_CARD_ENABLED: "true",
        PAYMENTS_ALLOW_MOCK: "true",
      },
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    // The server's 5 km calculation, not the forged 20 km.
    assert.equal(data.amount, 17500);
    assert.equal(rpcCalls.length, 1);
    assert.equal(Number(rpcCalls[0].p_distance_km), 5);
    assert.equal(Number(rpcCalls[0].p_total_fee), 17500);
  });
});

// ---------------------------------------------------------------------------
// 2 + 3. Webhook: duplicate delivery and bad signature
// ---------------------------------------------------------------------------

describe("webhook pipeline", () => {
  const BOOKING = "22222222-2222-2222-2222-222222222222";

  function booking(overrides = {}) {
    return {
      id: BOOKING,
      status: BOOKING_PAYMENT_STATUS.PENDING_PAYMENT,
      total_fee: 17500,
      course_fee: 14500,
      distance_fee: 3000,
      ...overrides,
    };
  }

  function hold(overrides = {}) {
    return {
      status: "pending",
      expires_at: holdExpiryDate().toISOString(),
      ...overrides,
    };
  }

  test("confirms the booking once and ignores a duplicate delivery", async () => {
    const client = memoryClient({ bookings: { [BOOKING]: booking() }, holds: { [BOOKING]: hold() } });
    const env = { PAYMENT_PROVIDER: "mock", PAYMENT_WEBHOOK_SECRET: SECRET };
    const { body, signature } = await signedMockEvent({
      eventId: "evt-1",
      bookingRef: BOOKING,
      status: "paid",
      amount: 17500,
    });
    const headers = { get: (n) => (n.toLowerCase() === "x-mock-signature" ? signature : null) };

    const first = await handleWebhook({ provider: mockProvider, rawBody: body, headers, env, client });
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { ok: true, confirmed: true, status: "paid" });
    assert.equal(client._state.bookings[BOOKING].status, "paid");
    assert.equal(client._state.bookings[BOOKING].payment_transaction_id, "mock-txn-evt-1");
    assert.equal(client._state.holds[BOOKING].status, "confirmed");
    assert.equal(client._state.events.length, 1);

    const second = await handleWebhook({ provider: mockProvider, rawBody: body, headers, env, client });
    assert.equal(second.status, 200);
    const secondBody = await second.json();
    assert.equal(secondBody.duplicated, true);
    assert.equal(secondBody.confirmed, undefined);

    // Nothing moved the second time.
    assert.equal(client._state.events.length, 1);
    assert.equal(client._state.bookings[BOOKING].payment_verified_at !== undefined, true);
  });

  test("rejects an invalid signature and changes nothing", async () => {
    const client = memoryClient({ bookings: { [BOOKING]: booking() }, holds: { [BOOKING]: hold() } });
    const env = { PAYMENT_PROVIDER: "mock", PAYMENT_WEBHOOK_SECRET: SECRET };
    const { body } = await signedMockEvent({ eventId: "evt-2", bookingRef: BOOKING });
    const headers = { get: () => "deadbeef" };

    const res = await handleWebhook({ provider: mockProvider, rawBody: body, headers, env, client });
    assert.equal(res.status, 401);

    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(client._state.events.length, 0);
    assert.equal(client._state.bookings[BOOKING].status, BOOKING_PAYMENT_STATUS.PENDING_PAYMENT);
    assert.equal(client._state.holds[BOOKING].status, "pending");
  });

  test("never confirms when the gateway amount disagrees with the server price", async () => {
    const client = memoryClient({ bookings: { [BOOKING]: booking() }, holds: { [BOOKING]: hold() } });
    const env = { PAYMENT_PROVIDER: "mock", PAYMENT_WEBHOOK_SECRET: SECRET };
    const { body, signature } = await signedMockEvent({
      eventId: "evt-3",
      bookingRef: BOOKING,
      amount: 100,
    });
    const headers = { get: () => signature };

    const res = await handleWebhook({ provider: mockProvider, rawBody: body, headers, env, client });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.confirmed, false);
    assert.equal(data.reason, "amount_mismatch");
    assert.equal(client._state.bookings[BOOKING].status, BOOKING_PAYMENT_STATUS.PENDING_PAYMENT);
  });
});

// ---------------------------------------------------------------------------
// 4. Expired holds
// ---------------------------------------------------------------------------

describe("hold expiry", () => {
  test("a hold blocks only while pending and inside its window", () => {
    assert.equal(isHoldActive({ status: "pending", expires_at: new Date(Date.now() + 60_000) }), true);
    assert.equal(isHoldActive({ status: "pending", expires_at: new Date(Date.now() - 60_000) }), false);
    assert.equal(isHoldActive({ status: "confirmed", expires_at: new Date(Date.now() + 60_000) }), false);
  });

  test("the status endpoint lazily expires a stale hold", async () => {
    const BOOKING = "33333333-3333-3333-3333-333333333333";
    const client = memoryClient({
      bookings: {
        [BOOKING]: { id: BOOKING, status: "pending_payment", total_fee: 17500 },
      },
      holds: {
        [BOOKING]: {
          status: "pending",
          expires_at: new Date(Date.now() - 60_000).toISOString(),
        },
      },
    });

    const res = await statusEndpoint({
      request: mockRequest({
        method: "GET",
        url: `https://example.com/api/v1/payments/status?booking=${BOOKING}`,
      }),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "expired");
    assert.equal(data.paid, false);
    assert.equal(client._state.bookings[BOOKING].status, "expired");
    assert.equal(client._state.holds[BOOKING].status, "expired");
  });

  test("a live hold keeps the booking pending", async () => {
    const BOOKING = "44444444-4444-4444-4444-444444444444";
    const client = memoryClient({
      bookings: {
        [BOOKING]: { id: BOOKING, status: "pending_payment", total_fee: 17500 },
      },
      holds: {
        [BOOKING]: { status: "pending", expires_at: holdExpiryDate().toISOString() },
      },
    });

    const res = await statusEndpoint({
      request: mockRequest({
        method: "GET",
        url: `https://example.com/api/v1/payments/status?booking=${BOOKING}`,
      }),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      },
    });

    const data = await res.json();
    assert.equal(data.status, "pending_payment");
    assert.equal(client._state.bookings[BOOKING].status, "pending_payment");
  });
});

// ---------------------------------------------------------------------------
// 5. Manual distance cannot be paid online
// ---------------------------------------------------------------------------

describe("manual distance", () => {
  test("canPayOnline refuses a manually typed distance", () => {
    const result = canPayOnline({
      wantsPickDrop: true,
      distanceSource: "manual",
      pickup: { lat: 31.5, lng: 74.35 },
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /manually/i);
  });

  test("create-session returns 409 and never calls the booking RPC", async () => {
    const originalFetch = globalThis.fetch;
    let rpcCalled = false;
    globalThis.fetch = async () => {
      rpcCalled = true;
      throw new Error("should not be reached");
    };

    try {
      const res = await createSession({
        request: mockRequest({
          url: "https://example.com/api/v1/payments/create-session",
          body: {
            customer_name: "Test",
            customer_phone: "03000000000",
            preferred_date: "2026-11-20",
            preferred_time: "12:00",
            course: "PLUS Plan",
            home_service: true,
            address: "Test address",
            distance_source: "manual",
            distance_km: 7,
          },
        }),
        env: {
          VITE_SUPABASE_URL: "https://example.supabase.co",
          VITE_SUPABASE_ANON_KEY: "anon",
          SUPABASE_SERVICE_ROLE_KEY: "service",
          PAYMENT_PROVIDER: "mock",
          PAYMENTS_CARD_ENABLED: "true",
        },
      });

      assert.equal(res.status, 409);
      const data = await res.json();
      assert.equal(data.code, "MANUAL_DISTANCE_NOT_PAYABLE_ONLINE");
      assert.equal(data.fallback, "manual_confirmation");
      assert.equal(rpcCalled, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("the feature flag keeps the endpoint closed when disabled", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("should not be reached");
    };
    try {
      const res = await createSession({
        request: mockRequest({
          url: "https://example.com/api/v1/payments/create-session",
          body: { customer_name: "Test", customer_phone: "0300" },
        }),
        env: {
          VITE_SUPABASE_URL: "https://example.supabase.co",
          VITE_SUPABASE_ANON_KEY: "anon",
          SUPABASE_SERVICE_ROLE_KEY: "service",
          PAYMENT_PROVIDER: "mock",
          PAYMENTS_CARD_ENABLED: "false",
        },
      });
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.code, "CARD_PAYMENTS_DISABLED");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// 6. The mock adapter is development-only
// ---------------------------------------------------------------------------

describe("mock provider is development-only", () => {
  test("production markers are recognised", () => {
    assert.equal(isProductionEnv({}), false);
    assert.equal(isProductionEnv({ CONTEXT: "production" }), true);
    assert.equal(isProductionEnv({ NODE_ENV: "production" }), true);
    assert.equal(isProductionEnv({ ENVIRONMENT: "production" }), true);
    assert.equal(isProductionEnv({ CF_PAGES: "1" }), true);
    assert.equal(isProductionEnv({ CONTEXT: "dev" }), false);
  });

  test("the flag alone is never enough on a deployed environment", () => {
    assert.equal(isMockPermitted({ PAYMENTS_ALLOW_MOCK: "true" }), true);
    assert.equal(isMockPermitted({}), false);
    assert.equal(isMockPermitted({ PAYMENTS_ALLOW_MOCK: "false" }), false);
    assert.equal(
      isMockPermitted({ PAYMENTS_ALLOW_MOCK: "true", CONTEXT: "production" }),
      false
    );
    assert.equal(
      isMockPermitted({ PAYMENTS_ALLOW_MOCK: "true", CF_PAGES: "1" }),
      false
    );
  });

  test("getProvider refuses the mock adapter in production", async () => {
    await assert.rejects(
      getProvider({
        PAYMENT_PROVIDER: "mock",
        PAYMENTS_ALLOW_MOCK: "true",
        CONTEXT: "production",
      }),
      /local-development adapter/
    );

    const provider = await getProvider({
      PAYMENT_PROVIDER: "mock",
      PAYMENTS_ALLOW_MOCK: "true",
    });
    assert.equal(provider.id, "mock");
  });

  test("create-session refuses the mock provider on a deployed site", async () => {
    const res = await createSession({
      request: mockRequest({
        url: "https://example.com/api/v1/payments/create-session",
        body: {
          customer_name: "Test",
          customer_phone: "03000000000",
          preferred_date: "2026-11-20",
          preferred_time: "12:00",
          course: "PLUS Plan",
        },
      }),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
        PAYMENT_PROVIDER: "mock",
        PAYMENTS_CARD_ENABLED: "true",
        PAYMENTS_ALLOW_MOCK: "true",
        CONTEXT: "production",
      },
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.code, "PROVIDER_NOT_PERMITTED");
  });

  test("the mock checkout page is unreachable in production", async () => {
    const production = await mockCheckout({
      request: mockRequest({
        method: "GET",
        url: "https://example.com/api/v1/payments/mock-checkout?session=s&booking=b",
      }),
      env: { PAYMENTS_ALLOW_MOCK: "true", CONTEXT: "production" },
    });
    assert.equal(production.status, 404);

    const local = await mockCheckout({
      request: mockRequest({
        method: "GET",
        url: "https://example.com/api/v1/payments/mock-checkout?session=s&booking=b&amount=100&currency=PKR",
      }),
      env: { PAYMENTS_ALLOW_MOCK: "true", PAYMENT_WEBHOOK_SECRET: SECRET },
    });
    assert.equal(local.status, 200);
    const html = await local.text();
    assert.match(html, /Mock checkout/);
  });

  test("the mock adapter refuses to sign or verify outside local development", async () => {
    await assert.rejects(
      mockProvider.createCheckoutSession({
        checkoutUrlBase: "https://example.com",
        bookingId: "b",
        amount: 100,
        currency: "PKR",
        customer: { name: "T", phone: "P" },
        env: { PAYMENTS_ALLOW_MOCK: "true", CF_PAGES: "1" },
      }),
      /not permitted/
    );

    await assert.rejects(
      mockProvider.verifyWebhook({
        rawBody: "{}",
        headers: { get: () => "" },
        env: { PAYMENTS_ALLOW_MOCK: "true", NODE_ENV: "production" },
      }),
      /not permitted/
    );
  });
});
