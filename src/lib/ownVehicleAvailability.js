// =============================================================================
// Own-Vehicle availability loader
// =============================================================================
// Same endpoint as /slot-availability (bookingApi.fetchAvailability). In DEV,
// when the URL carries ?demo=1, a fixed fake payload is returned instead so
// the page can be checked without the Cloudflare-only Supabase variables.
//
// The demo module is behind a dynamic import inside the `import.meta.env.DEV`
// guard, so it is tree-shaken out of production builds.
// =============================================================================

import { fetchAvailability } from "./bookingApi";

export async function fetchOwnVehicleAvailability(date) {
  const params = new URLSearchParams(window.location.search);

  if (import.meta.env.DEV && params.get("demo") === "1") {
    const { buildDemoAvailability } = await import("./ownVehicleDemoData.js");
    return buildDemoAvailability(date);
  }

  return fetchAvailability(date);
}
