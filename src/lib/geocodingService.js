// =============================================================================
// Address search — rate limiter, cache and provider dispatch.
//
// Nominatim's public instance allows at most 1 request per second, so the
// limit is enforced here, globally for the whole session, rather than relying
// on the UI to debounce. Search is triggered by an explicit submit (Enter or
// the search button) — never as the customer types.
// =============================================================================
import { geocodingProvider } from "./geocoding/geocodingProviders";
import {
  GEOCODE_CACHE_LIMIT,
  GEOCODE_MIN_INTERVAL_MS,
} from "./serviceAreaConfig";

export class GeocodingError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeocodingError";
  }
}

/** Results keyed by provider + normalised query, so re-searching an address
 *  is free and never hits the upstream server twice. */
const cache = new Map();

/** Serialises provider calls and keeps at least MIN_INTERVAL between them. */
let lastRequestAt = 0;
let queue = Promise.resolve();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function schedule(task) {
  const run = async () => {
    const wait = GEOCODE_MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await delay(wait);
    lastRequestAt = Date.now();
    return task();
  };

  // Chain onto the previous task whether it resolved or rejected, so one
  // failed search never blocks the next one.
  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array<{ label: string, lat: number, lng: number, type: string }>>}
 * @throws {GeocodingError}
 */
export async function searchAddresses(query, { signal, limit = 5 } = {}) {
  const normalised = String(query ?? "").trim();
  if (!normalised) return [];

  const key = `${geocodingProvider.id}|${normalised.toLowerCase()}|${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const results = await schedule(() =>
      geocodingProvider.search(normalised, { signal, limit })
    );

    // A queued request can come back after the customer has moved on.
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    if (cache.size >= GEOCODE_CACHE_LIMIT) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, results);

    return results;
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new GeocodingError(
      error?.message ||
        "Address search is unavailable right now — you can still tap the map to drop a pin."
    );
  }
}

/** Clear the geocode cache. Exposed for tests and for provider swaps. */
export function clearGeocodeCache() {
  cache.clear();
}
