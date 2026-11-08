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

/** Branded teardrop pin drawn as inline SVG — no remote marker images to
 *  fail, and the colours come from the map theme in config. */
export function createPinIcon(color) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44" fill="none">`,
    `<path d="M17 1C7.6 1 0 8.6 0 18c0 12.2 17 25 17 25s17-12.8 17-25C34 8.6 26.4 1 17 1z" fill="${color}"/>`,
    `<circle cx="17" cy="17.5" r="6" fill="#ffffff"/>`,
    `</svg>`,
  ].join("");

  return divIcon({
    html: svg,
    className: "rdc-pin",
    iconSize: [34, 44],
    iconAnchor: [17, 43],
    popupAnchor: [0, -40],
  });
}

export const baseIcon = createPinIcon(MAP_THEME.basePinColor);
export const pickupIcon = createPinIcon(MAP_THEME.pickupPinColor);

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
