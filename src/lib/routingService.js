// =============================================================================
// Routing provider — OSRM (public demo instance by default).
//
// One small module so the provider can be swapped later (self-hosted OSRM,
// OpenRouteService, GraphHopper) by changing this file only. The component
// never talks to a routing API directly.
// =============================================================================
import {
  ROUTE_BASE_URL,
  ROUTE_API_KEY,
  ROUTE_TIMEOUT_MS,
  ROUTE_CACHE_LIMIT,
  COORD_ROUND_DECIMALS,
} from "./serviceAreaConfig";

/** Route responses keyed by rounded coordinates — avoids duplicate requests
 *  when the pin is dragged back over a spot we already routed. */
const routeCache = new Map();

/** Cache key from two coordinates, rounded to ~1 m. */
export function routeCacheKey(from, to) {
  const round = (n) => Number(n).toFixed(COORD_ROUND_DECIMALS);
  return `${round(from.lng)},${round(from.lat)}|${round(to.lng)},${round(to.lat)}`;
}

/** Error with a `type` the UI can switch on. Never leaks provider details. */
export class RoutingError extends Error {
  /**
   * @param {"network" | "rate-limit" | "no-route" | "bad-response" | "timeout"} type
   * @param {string} message
   */
  constructor(type, message) {
    super(message);
    this.name = "RoutingError";
    this.type = type;
  }
}

/** Combine the caller's cancel signal with a hard timeout.
 *  `AbortSignal.any` is the clean path; the manual version covers browsers
 *  that only implement the individual pieces. */
function composeSignal(signal, timeoutMs) {
  if (typeof AbortSignal.timeout !== "function") return signal;

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeoutSignal;

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  const controller = new AbortController();
  const forward = () => {
    cleanup();
    controller.abort(signal.reason ?? timeoutSignal.reason);
  };
  const cleanup = () => {
    signal.removeEventListener("abort", forward);
    timeoutSignal.removeEventListener("abort", forward);
  };

  signal.addEventListener("abort", forward, { once: true });
  timeoutSignal.addEventListener("abort", forward, { once: true });
  return controller.signal;
}

/** Great-circle distance in km.
 *  Used ONLY as a labelled estimate when routing fails — never fed into the
 *  pricing engine. */
export function haversineKm(from, to) {
  const R = 6371; // Earth radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Fetch the driving route between two points.
 *
 * @param {{lat: number, lng: number}} from
 * @param {{lat: number, lng: number}} to
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ geometry: object, distanceKm: number, durationMinutes: number }>}
 *   `geometry` is a GeoJSON LineString whose coordinates are [lng, lat] —
 *   that is the order Leaflet's <GeoJSON> expects.
 * @throws {RoutingError}
 */
export async function getDrivingRoute(from, to, { signal } = {}) {
  const key = routeCacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${ROUTE_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  let response;
  try {
    response = await fetch(url, {
      signal: composeSignal(signal, ROUTE_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        // Only sent when a key is configured; the OSRM demo needs none.
        ...(ROUTE_API_KEY ? { Authorization: ROUTE_API_KEY } : {}),
      },
    });
  } catch (error) {
    // A caller-initiated abort (the pin moved) is not a service problem.
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      if (signal?.aborted) throw error;
      throw new RoutingError(
        "timeout",
        "The routing service is taking longer than usual. Showing a straight-line estimate instead."
      );
    }
    throw new RoutingError(
      "network",
      "We could not reach the routing service. Showing a straight-line estimate instead."
    );
  }

  if (response.status === 429) {
    throw new RoutingError(
      "rate-limit",
      "The routing service is busy right now. Showing a straight-line estimate instead."
    );
  }

  if (!response.ok) {
    throw new RoutingError(
      "network",
      `The routing service returned an error (${response.status}). Showing a straight-line estimate instead.`
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new RoutingError(
      "bad-response",
      "The routing service sent an unreadable response. Showing a straight-line estimate instead."
    );
  }

  const route = payload?.routes?.[0];
  if (payload?.code !== "Ok" || !route?.geometry?.coordinates?.length) {
    throw new RoutingError(
      "no-route",
      "No driving route was found between these two points."
    );
  }

  if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new RoutingError(
      "bad-response",
      "The routing service returned an incomplete route. Showing a straight-line estimate instead."
    );
  }

  const result = {
    geometry: route.geometry,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  };

  if (routeCache.size >= ROUTE_CACHE_LIMIT) {
    routeCache.delete(routeCache.keys().next().value);
  }
  routeCache.set(key, result);

  return result;
}

/** Clear the route cache. Exposed for tests and for provider swaps. */
export function clearRouteCache() {
  routeCache.clear();
}
