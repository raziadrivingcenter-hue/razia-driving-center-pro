# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Service-area zones

The free (2 KM) and service (20 KM) zones drawn on the homepage map are
**road-based isochrones**, not circles — the area actually reachable by car
within that driving distance from the office. That matters because the pick-up
charge is calculated from the driven distance, so a straight-line circle would
misrepresent both the boundary and the price.

The booking form on the slot-availability page uses the same polygons: the
customer drags the map to put their pickup under a fixed crosshair, the route
is fetched 1.5 s after they stop, and the same point-in-polygon test decides
whether the pickup is inside the service area. A pickup the homepage map would
reject cannot be booked.

The polygons live in
[`src/data/service-zones.geojson`](src/data/service-zones.geojson) and are
generated **offline, by hand**. Nothing at build time or page load calls a
routing API to produce them, so the public site needs no API key for this.

### Regenerating the zones

Run the generator when `BASE_LOCATION` in
[`src/lib/serviceAreaConfig.js`](src/lib/serviceAreaConfig.js) changes, or every
few months as Lahore's road network changes.

```bash
# OpenRouteService (preferred) — needs a free API key
ORS_API_KEY=... node scripts/generate-zones.mjs
```

Put the key in `.env.local`, which `.gitignore` already excludes via `*.local`.
The generator reads it from there automatically; it is never written into the
GeoJSON, the frontend bundle, or the repository.

```bash
# Keyless bootstrap — Valhalla's public demo instance. Different routing
# engine, so the outlines differ slightly from OpenRouteService.
node scripts/generate-zones.mjs --provider=valhalla
```

Each run overwrites `src/data/service-zones.geojson` and stamps it with
`generatedAt` and `source`, so the file always records which engine produced
it. A run makes two API calls, one per range (2 KM and 20 KM).
