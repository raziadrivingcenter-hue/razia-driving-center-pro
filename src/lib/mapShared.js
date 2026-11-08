/* ------------------------------------------------------------------ */
/*  mapShared — presentation helpers shared by every Leaflet map on    */
/*  the site (homepage service-area map + booking pickup map).         */
/*                                                                    */
/*  None of this is JSX; the theme object is handed to the stylesheet  */
/*  as CSS custom properties on the map element.                       */
/* ------------------------------------------------------------------ */
import { divIcon } from "leaflet";
import { MAP_THEME } from "./serviceAreaConfig";

/** Hand the map theme to the stylesheet as custom properties, so the zoom
 *  control, attribution and popups are coloured from the same config object
 *  that colours the route and the zones. */
export const mapThemeVars = {
  "--map-control-bg": MAP_THEME.controlBackground,
  "--map-control-bg-hover": MAP_THEME.controlBackgroundHover,
  "--map-control-color": MAP_THEME.controlColor,
  "--map-control-border": MAP_THEME.controlBorder,
  "--map-attribution-bg": MAP_THEME.attributionBackground,
  "--map-attribution-color": MAP_THEME.attributionColor,
  "--map-attribution-link": MAP_THEME.attributionLinkColor,
  "--map-popup-bg": MAP_THEME.popupBackground,
  "--map-popup-color": MAP_THEME.popupColor,
};

// The pin artwork is src/assets/mappin.svg. Its viewBox is square (498.22²)
// but the teardrop only fills the middle of it, so the viewBox is cropped to
// the artwork — otherwise the pin letterboxes inside its own box and comes
// out far smaller than the size asked for. The inner circle is a hole, which
// is what `fill-rule="evenodd"` gives us regardless of path winding.
const PIN_VIEWBOX = "95.77 0 306.7 498.22";
const PIN_PATH = [
  "M269.061,484.131c-3.185,8.461-11.255,14.049-20.273,14.089",
  "c-9.028,0.029-17.147-5.501-20.39-13.913",
  "c-44.034-114.321-132.63-261.205-132.63-330.964",
  "C95.767,68.801,164.539,0,249.12,0",
  "c84.541,0,153.333,68.801,153.333,153.343",
  "C402.462,223.307,312.557,368.579,269.061,484.131z",
  "M249.12,29.164c-66.32,0-120.261,53.941-120.261,120.232",
  "c0,66.33,53.941,120.3,120.261,120.3",
  "c66.3,0,120.241-53.951,120.241-120.3",
  "C369.351,83.105,315.42,29.164,249.12,29.164z",
].join("");
const PIN_ASPECT = 306.7 / 498.22;

/** Branded teardrop pin drawn as inline SVG — no remote marker images to
 *  fail, and the colours come from the map theme in config. `width` is the
 *  rendered width in px; the height follows the artwork's own proportions,
 *  and the pin is anchored at its tip. */
export function createPinIcon(color, width = 34) {
  const height = Math.round(width / PIN_ASPECT);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${PIN_VIEWBOX}" fill="none">`,
    `<path fill="${color}" fill-rule="evenodd" d="${PIN_PATH}"/>`,
    `</svg>`,
  ].join("");

  return divIcon({
    html: svg,
    className: "rdc-pin",
    iconSize: [width, height],
    iconAnchor: [Math.round(width / 2), height],
    popupAnchor: [0, -(height - 4)],
  });
}

// Both pins keep their existing colours. The pickup pin is drawn slightly
// smaller than the centre pin so the two read as different ranks.
export const baseIcon = createPinIcon(MAP_THEME.basePinColor, 30);
export const pickupIcon = createPinIcon(MAP_THEME.pickupPinColor, 26);

/** MapLibre renders through WebGL — detect it once so an unsupported device
 *  gets an explanation instead of a blank map. */
export function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
