// =============================================================================
// MapLibre GL bootstrap.
//
// MapLibre runs its tile parsing in a Web Worker. Under a bundler the worker
// file is not next to the library at runtime, so its URL has to be handed over
// explicitly — `?url` makes Vite emit the worker as an asset and return its
// public URL. This must happen before the first Map is constructed.
// =============================================================================
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";

let configured = false;

/** Idempotent — safe to call before every map mount. */
export function ensureMapLibreWorker() {
  if (configured) return;
  setWorkerUrl(workerUrl);
  configured = true;
}
