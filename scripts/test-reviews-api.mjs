/* ------------------------------------------------------------------ */
/*  Local integration tests for functions/api/reviews.js
/*  Mocks global fetch + env, drives the real handler through every
/*  scenario the task requires.  Run: node scripts/test-reviews-api.mjs
/* ------------------------------------------------------------------ */

import assert from "node:assert";

// ---- test harness ----
let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failures.push({ name, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}

// Each test gets a fresh copy of the module so module-level caches
// (reviewsCache, lastGoodCache, cachedToken, pending promises) don't
// leak between scenarios.
async function freshHandler() {
  // Bust the ESM cache so module state is reset.
  const mod = await import(
    `../functions/api/reviews.js?t=${Date.now()}${Math.random()}`
  );
  return mod.onRequest;
}

// Build a minimal request object.
function makeRequest(method = "GET") {
  return {
    method,
    headers: new Map(),
  };
}

function makeEnv(overrides = {}) {
  return {
    GBP_CLIENT_ID: "test-client-id",
    GBP_CLIENT_SECRET: "test-secret",
    GBP_REFRESH_TOKEN: "test-refresh",
    GBP_ACCOUNT_ID: "test-account",
    GBP_LOCATION_ID: "test-location",
    ...overrides,
  };
}

// Mock fetch with a controller that can simulate delays, failures,
// token responses, and review pages.
// A fetch promise that rejects when the AbortSignal fires, so the mock
// behaves like the real network (AbortController can actually cancel it).
function abortableFetch(promiseFactory) {
  return (url, opts) => {
    const ac = new AbortController();
    // Forward our own signal to the caller's abort handling.
    if (opts?.signal) {
      opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
    }
    // Combine: settle when either the work completes OR abort fires.
    return Promise.race([
      promiseFactory(url, opts),
      new Promise((_, reject) => {
        ac.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
        // Also react to the caller's signal directly in case the above missed.
        if (opts?.signal) {
          if (opts.signal.aborted) reject(new DOMException("aborted", "AbortError"));
        }
      }),
    ]);
  };
}

function installMockFetch({ tokenResponse, pageResponse, pageDelay = 0 } = {}) {
  const defaultPage = (url) => jsonResponse({
    reviews: [
      { reviewer: { displayName: "Alice" }, starRating: "FIVE", createTime: "2024-01-01T00:00:00Z", comment: "Great!" },
      { reviewer: { displayName: "Bob" }, starRating: "FOUR", createTime: "2024-02-01T00:00:00Z", comment: "Good" },
      { reviewer: { displayName: "Carol" }, starRating: "FIVE", createTime: "2024-03-01T00:00:00Z", comment: "Love it" },
    ],
    totalReviewCount: 3,
    averageRating: 4.7,
  });

  globalThis.fetch = abortableFetch(async (url) => {
    if (url.includes("oauth2.googleapis.com/token")) {
      return tokenResponse ? tokenResponse() : jsonResponse({ access_token: "fake-token", expires_in: 3600 });
    }
    if (url.includes("mybusiness.googleapis.com")) {
      if (pageDelay > 0) await sleep(pageDelay);
      return pageResponse ? pageResponse(url) : defaultPage(url);
    }
    throw new Error("unexpected fetch: " + url);
  });
}

function jsonResponse(obj, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => obj,
    text: async () => JSON.stringify(obj),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callHandler(handler, env, method = "GET") {
  const res = await handler({ request: makeRequest(method), env });
  const body = await res.json();
  return { status: res.status, body };
}

// Allow overriding the module's internal timeouts for fast testing.
function withShortTimeouts() {
  // The module reads its constants at call time from module scope; we
  // can't easily poke them.  Instead the tests use delays shorter than
  // the real timeouts (4s token, 3s page) — we keep them well under.
}

console.log("\n=== Reviews API tests ===\n");

await (async () => {
  // 1. Successful response
  {
    installMockFetch();
    const handler = await freshHandler();
    const { status, body } = await callHandler(handler, makeEnv());
    test("successful fetch returns reviews", () => {
      assert.equal(status, 200);
      assert.equal(body.reviews.length, 3);
      assert.equal(body.fetched, true);
      assert.equal(body.cached, false);
      assert.equal(body.totalReviewCount, 3);
      assert.equal(body.reviews[0].name, "Alice");
      assert.equal(body.reviews[0].rating, 5);
    });
  }

  // 2. Cached response on second call (no new fetch of reviews — token reused)
  {
    let pageCalls = 0;
    installMockFetch({
      pageResponse: (url) => {
        pageCalls++;
        return jsonResponse({
          reviews: [{ reviewer: { displayName: "Dave" }, starRating: "FIVE", createTime: "2024-04-01T00:00:00Z", comment: "Top" }],
          totalReviewCount: 1,
          averageRating: 5.0,
        });
      },
    });
    const handler = await freshHandler();
    await callHandler(handler, makeEnv()); // prime cache
    const { body } = await callHandler(handler, makeEnv()); // should hit cache
    test("second call serves from hourly cache", () => {
      assert.equal(body.cached, true);
      // token + page were called during priming; cache hit means no new page fetch
      assert.equal(pageCalls, 1, `expected 1 page call (priming only), got ${pageCalls}`);
    });
  }

  // 3. OAuth token refresh failure
  {
    installMockFetch({
      tokenResponse: () => jsonResponse({ error: "invalid_grant" }, 400),
    });
    const handler = await freshHandler();
    const { status, body } = await callHandler(handler, makeEnv());
    test("token refresh failure returns 503 with diagnostics", () => {
      assert.equal(status, 503);
      assert.equal(body.configured, true);
      assert.equal(body.diagnostics.errorCategory, "token_refresh_failed");
      assert.equal(body.reviews.length, 0);
    });
  }

  // 4. Google API timeout (page fetch exceeds budget)
  {
    // A fetch that hangs until the AbortSignal fires, then rejects —
    // same contract as the real network.  PAGE_TIMEOUT_MS is 3000ms, so
    // this proves the handler is bounded without waiting 3s... except it
    // does wait ~3s.  To keep the suite fast we temporarily lower the
    // module's page timeout via a global the handler checks.
    globalThis.__REVIEWS_TEST_PAGE_TIMEOUT_MS__ = 400;
    globalThis.fetch = (url, opts) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      if (url.includes("mybusiness.googleapis.com")) {
        // Hang until aborted, then reject with AbortError (real fetch contract).
        return new Promise((_, reject) => {
          const t = setTimeout(() => reject(new Error("hung-no-abort")), 20000);
          opts?.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("aborted", "AbortError"));
          }, { once: true });
        });
      }
      return Promise.reject(new Error("unexpected"));
    };
    const handler = await freshHandler();
    const start = Date.now();
    const { status, body } = await callHandler(handler, makeEnv());
    const elapsed = Date.now() - start;
    delete globalThis.__REVIEWS_TEST_PAGE_TIMEOUT_MS__;
    test("page-fetch timeout is bounded and returns 503 timeout", () => {
      assert.equal(status, 503);
      assert.equal(body.diagnostics.errorCategory, "timeout");
      assert.ok(elapsed < 2000, `timeout took ${elapsed}ms — should be bounded well under 2s`);
    });
  }

  // 5. Empty reviews (configured but no reviews)
  {
    installMockFetch({
      pageResponse: () => jsonResponse({ reviews: [], totalReviewCount: 0 }),
    });
    const handler = await freshHandler();
    const { status, body } = await callHandler(handler, makeEnv());
    test("empty review list returns 200 with empty array", () => {
      assert.equal(status, 200);
      assert.equal(body.reviews.length, 0);
      assert.equal(body.fetched, true);
    });
  }

  // 6. Stale-cache fallback: cache exists, fresh fetch times out
  {
    globalThis.fetch = async (url) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return jsonResponse({ access_token: "fake-token", expires_in: 3600 });
      if (url.includes("mybusiness.googleapis.com"))
        return new Promise(() => {}); // hang → timeout
      throw new Error("unexpected");
    };
    const handler = await freshHandler();
    // Prime the cache by directly... we can't because fetch hangs on pages.
    // So we use lastGood fallback path: first a success, then a failure.
  }

  // 6b. Two-phase: succeed then fail → last-good fallback served
  {
    // Force the hourly cache to expire immediately so the second call
    // actually attempts a fresh fetch (and hits the timeout path).
    globalThis.__REVIEWS_TEST_CACHE_TTL_MS__ = 0;
    let phase = 0;
    globalThis.fetch = (url, opts) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      if (url.includes("mybusiness.googleapis.com")) {
        phase++;
        if (phase === 1) {
          return Promise.resolve(jsonResponse({
            reviews: [{ reviewer: { displayName: "Eve" }, starRating: "FIVE", createTime: "2024-05-01T00:00:00Z", comment: "Fallback me" }],
            totalReviewCount: 1,
            averageRating: 5.0,
          }));
        }
        // subsequent calls hang until aborted → timeout path.
        return new Promise((_, reject) => {
          const t = setTimeout(() => reject(new Error("hung-no-abort")), 20000);
          opts?.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("aborted", "AbortError"));
          }, { once: true });
        });
      }
      return Promise.reject(new Error("unexpected"));
    };
    const handler = await freshHandler();
    const first = await callHandler(handler, makeEnv());
    delete globalThis.__REVIEWS_TEST_CACHE_TTL_MS__;
    test("first call succeeds and populates last-good cache", () => {
      assert.equal(first.status, 200);
      assert.equal(first.body.reviews[0].name, "Eve");
    });
    const second = await callHandler(handler, makeEnv());
    test("timeout after success serves last-good stale fallback", () => {
      assert.equal(second.status, 200, `expected 200 fallback, got ${second.status}`);
      assert.ok(second.body.stale === true, "should be marked stale");
      assert.equal(second.body.reviews[0].name, "Eve", "should serve Eve from last-good cache");
    });
  }

  // 7. Not configured → 200 + configured:false
  {
    installMockFetch();
    const handler = await freshHandler();
    const { status, body } = await callHandler(handler, makeEnv({ GBP_CLIENT_ID: "" }));
    test("missing credentials returns configured:false", () => {
      assert.equal(status, 200);
      assert.equal(body.configured, false);
    });
  }

  // 8. POST method → 405
  {
    const handler = await freshHandler();
    const { status } = await callHandler(handler, makeEnv(), "POST");
    test("non-GET method returns 405", () => {
      assert.equal(status, 405);
    });
  }

  // 9. OPTIONS preflight → 204
  {
    const handler = await freshHandler();
    const res = await handler({ request: makeRequest("OPTIONS"), env: makeEnv() });
    test("OPTIONS preflight returns 204", () => {
      assert.equal(res.status, 204);
    });
  }

  // 10. Permanently pending token refresh → hard deadline, NOT a hang.
  // The token fetch never resolves; the handler must still respond within
  // the hard deadline (not block forever, which is the production bug).
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 500;
    globalThis.fetch = (url) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        // NEVER resolves — simulates a hung token endpoint.
        return new Promise(() => {});
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    const start = Date.now();
    const { status, body } = await callHandler(handler, makeEnv());
    const elapsed = Date.now() - start;
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("hung token refresh is bounded by hard deadline, returns 503", () => {
      assert.equal(status, 503, `expected 503, got ${status}`);
      assert.equal(body.diagnostics.errorCategory, "hard_deadline");
      assert.ok(elapsed < 2000, `hung token took ${elapsed}ms — must be bounded well under 2s`);
    });
  }

  // 11. Permanently pending Google page fetch → hard deadline, NOT a hang.
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 500;
    globalThis.fetch = (url) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      }
      if (url.includes("mybusiness.googleapis.com")) {
        // NEVER resolves — simulates a hung GBP endpoint.
        return new Promise(() => {});
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    const start = Date.now();
    const { status, body } = await callHandler(handler, makeEnv());
    const elapsed = Date.now() - start;
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("hung Google page fetch is bounded by hard deadline, returns 503", () => {
      assert.equal(status, 503, `expected 503, got ${status}`);
      assert.equal(body.diagnostics.errorCategory, "hard_deadline");
      assert.ok(elapsed < 2000, `hung page fetch took ${elapsed}ms — must be bounded well under 2s`);
    });
  }

  // 12. Concurrent request sharing a stuck in-flight promise must NOT hang.
  // Request A starts a fetch that never resolves; request B arrives while A
// is "in flight" and shares pendingReviewsPromise.  B must still get a
  // bounded response, not block behind A forever.
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 500;
    globalThis.fetch = (url) => {
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      }
      if (url.includes("mybusiness.googleapis.com")) {
        // First call hangs forever; never resolves.
        return new Promise(() => {});
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    const start = Date.now();
    // Fire two concurrent requests; the second shares the first's stuck promise.
    const [resA, resB] = await Promise.all([
      callHandler(handler, makeEnv()),
      callHandler(handler, makeEnv()),
    ]);
    const elapsed = Date.now() - start;
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("concurrent requests sharing a stuck promise both get bounded responses", () => {
      assert.ok(resA.status === 503 || resA.status === 200, `req A unexpected status ${resA.status}`);
      assert.ok(resB.status === 503 || resB.status === 200, `req B unexpected status ${resB.status}`);
      assert.ok(elapsed < 3000, `concurrent hung requests took ${elapsed}ms — must be bounded`);
    });
  }

  // 13. Fresh request succeeds AFTER the previous request times out.
  // Proves the timed-out promise is fully released and doesn't poison later work.
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 400;
    let callCount = 0;
    globalThis.fetch = (url, opts) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      if (url.includes("mybusiness.googleapis.com")) {
        callCount++;
        if (callCount === 1) {
          // First page fetch hangs until aborted → triggers deadline.
          return new Promise((_, reject) => {
            const t = setTimeout(() => reject(new Error("hung-no-abort")), 20000);
            opts?.signal?.addEventListener("abort", () => {
              clearTimeout(t);
              reject(new DOMException("aborted", "AbortError"));
            }, { once: true });
          });
        }
        // Subsequent calls succeed.
        return Promise.resolve(jsonResponse({
          reviews: [{ reviewer: { displayName: "AfterTimeout" }, starRating: "FIVE", createTime: "2024-06-01T00:00:00Z", comment: "ok" }],
          totalReviewCount: 1,
          averageRating: 5.0,
        }));
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    const timedOut = await callHandler(handler, makeEnv());
    const start = Date.now();
    const after = await callHandler(handler, makeEnv());
    const elapsed = Date.now() - start;
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("fresh request after a timeout succeeds with live reviews", () => {
      assert.equal(timedOut.status, 503, `first (timed-out) expected 503, got ${timedOut.status}`);
      assert.equal(after.status, 200, `post-timeout request expected 200, got ${after.status}`);
      assert.equal(after.body.reviews[0].name, "AfterTimeout");
      assert.equal(after.body.fetched, true);
      assert.ok(elapsed < 2000, `post-timeout request took ${elapsed}ms — must be bounded`);
    });
  }

  // 14. Late settlement of an OLD promise must NOT block or corrupt a NEW request.
  // Request A's fetch hangs past the deadline. While A is still "pending",
  // Request B starts and succeeds. When A's underlying fetch finally settles
  // (late), its identity-checked cleanup must leave B's state intact.
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 300;
    const listeners = [];
    let pageCall = 0;
    globalThis.fetch = (url, opts) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      if (url.includes("mybusiness.googleapis.com")) {
        pageCall++;
        if (pageCall === 1) {
          // Hang until explicitly released (simulates a very slow response).
          return new Promise((resolve) => {
            listeners.push({ resolve, review: { reviewer: { displayName: "LateAlice" }, starRating: "FIVE", createTime: "2024-07-01T00:00:00Z", comment: "late" } });
          });
        }
        return Promise.resolve(jsonResponse({
          reviews: [{ reviewer: { displayName: "NewBob" }, starRating: "FIVE", createTime: "2024-08-01T00:00:00Z", comment: "new" }],
          totalReviewCount: 1, averageRating: 5.0,
        }));
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    const reqA = callHandler(handler, makeEnv()); // will time out
    // Let A's deadline fire.
    await sleep(600);
    // Now B starts and should succeed independently.
    const reqB = await callHandler(handler, makeEnv());
    // Release the late settlement of A's fetch AFTER B completed.
    listeners.forEach(({ resolve, review }) =>
      resolve(jsonResponse({ reviews: [review], totalReviewCount: 1, averageRating: 5.0 }))
    );
    const resA = await reqA;
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("late settlement of old promise does not block or corrupt new request", () => {
      assert.equal(resA.status, 503, `req A (timed-out) expected 503, got ${resA.status}`);
      assert.equal(reqB.status, 200, `req B expected 200, got ${reqB.status}`);
      assert.equal(reqB.body.reviews[0].name, "NewBob", "req B must serve its own result, not the late one");
      assert.equal(reqB.body.fetched, true);
    });
  }

  // 15. Identity check: old promise cleanup must not clobber a NEW in-flight promise.
  // Verifies the `pendingReviewsPromise === work` guard directly by counting
  // how many independent page fetches actually reach Google. Without the guard,
  // a late cleanup could reset the dedup slot and allow a duplicate fetch.
  {
    globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__ = 300;
    let pageCalls = 0;
    globalThis.fetch = (url, opts) => {
      if (url.includes("oauth2.googleapis.com/token"))
        return Promise.resolve(jsonResponse({ access_token: "fake-token", expires_in: 3600 }));
      if (url.includes("mybusiness.googleapis.com")) {
        pageCalls++;
        // All fetches hang until aborted → every caller hits the deadline path.
        return new Promise((_, reject) => {
          const t = setTimeout(() => reject(new Error("hung-no-abort")), 20000);
          opts?.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("aborted", "AbortError"));
          }, { once: true });
        });
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    };
    const handler = await freshHandler();
    // Fire 3 sequential requests; each times out, then the next starts fresh.
    const r1 = await callHandler(handler, makeEnv());
    const r2 = await callHandler(handler, makeEnv());
    const r3 = await callHandler(handler, makeEnv());
    delete globalThis.__REVIEWS_TEST_HARD_DEADLINE_MS__;
    test("each timed-out request still only fires its own fetch (no dedup leak)", () => {
      assert.equal(r1.status, 503);
      assert.equal(r2.status, 503);
      assert.equal(r3.status, 503);
      // Each request that owns the slot fires exactly one page fetch.
      assert.equal(pageCalls, 3, `expected 3 page calls (one per owner), got ${pageCalls}`);
    });
  }

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  if (fail > 0) {
    console.log("FAILURES:");
    for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
    process.exit(1);
  }
})();
