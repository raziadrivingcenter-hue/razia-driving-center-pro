// =============================================================================
// Geocoding providers
//
// Every provider exposes the same two things:
//   id     — stable string used in cache keys
//   search — (query, { signal, limit }) => Promise<Array<
//              { label: string, lat: number, lng: number, type: string }>>
//
// geocodingService.js only ever talks to `geocodingProvider`, so moving to
// OpenRouteService (or a paid geocoder) is a change here plus an API key —
// no UI or service changes.
// =============================================================================
import { GEOCODE_ENDPOINT } from "../serviceAreaConfig";

const MISSING_HINT = " You can still tap the map to drop a pin.";

/** Nominatim, called through our own Pages Function.
 *
 *  The proxy exists because Nominatim's usage policy requires a descriptive
 *  User-Agent / Referer, and browsers refuse to let JavaScript set those
 *  headers. It also keeps the provider server-side, so the direct swap below
 *  has somewhere to put a secret key. */
export const nominatimProvider = {
  id: "nominatim",

  async search(query, { signal, limit = 5 } = {}) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });

    let response;
    try {
      response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`, { signal });
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw new Error(`Address search is unavailable right now.${MISSING_HINT}`, {
        cause: error,
      });
    }

    if (!response.ok) {
      throw new Error(`Address search failed (${response.status}).${MISSING_HINT}`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`Address search returned an unreadable response.${MISSING_HINT}`);
    }

    return Array.isArray(payload?.results)
      ? payload.results.map((item) => ({
          label: item.label,
          lat: item.lat,
          lng: item.lng,
          type: item.type,
        }))
      : [];
  },
};

/** OpenRouteService Geocode — placeholder.
 *
 *  Not wired up: it needs an API key and must be proxied server-side so the
 *  key never ships to the browser. Implement `search` against the same
 *  `/api/v1/geocode` contract (or a new Pages Function) and point
 *  `geocodingProvider` at it. */
export const openRouteServiceProvider = {
  id: "openrouteservice",

  async search() {
    throw new Error(
      "OpenRouteService geocoding is not configured yet. Set it up in src/lib/geocoding/geocodingProviders.js."
    );
  },
};

/** The active provider. Change this one line to switch geocoders. */
export const geocodingProvider = nominatimProvider;
