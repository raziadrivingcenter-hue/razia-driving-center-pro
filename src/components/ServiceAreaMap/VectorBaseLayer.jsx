/* ------------------------------------------------------------------ */
/*  VectorBaseLayer — OpenFreeMap vector tiles rendered by MapLibre,   */
/*  mounted as a plain Leaflet layer.                                  */
/*                                                                    */
/*  Keeping it as a Leaflet layer means every overlay above it         */
/*  (radius circles, route, pins) is unchanged. `interactive` stays   */
/*  false so Leaflet keeps ownership of pan, zoom and tap.             */
/* ------------------------------------------------------------------ */
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { MAP_STYLE_URL, MAP_ATTRIBUTION } from "../../lib/serviceAreaConfig";
import { ensureMapLibreWorker } from "../../lib/maplibreSetup";

export default function VectorBaseLayer() {
  const map = useMap();

  useEffect(() => {
    ensureMapLibreWorker();

    let layer = null;
    try {
      layer = maplibreGL({
        style: MAP_STYLE_URL,
        interactive: false,
        pane: "tilePane",
        // MapLibre's own attribution control is disabled by the bridge; this
        // string is what it forwards to Leaflet's attribution control.
        attributionControl: { customAttribution: MAP_ATTRIBUTION },
      });
      layer.addTo(map);
    } catch (error) {
      // A basemap that cannot start must not take the overlays with it.
      console.error("Vector basemap failed to start:", error);
      return undefined;
    }

    return () => map.removeLayer(layer);
  }, [map]);

  return null;
}
