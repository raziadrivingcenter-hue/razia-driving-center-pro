/* ------------------------------------------------------------------ */
/*  ServiceAreaMap — interactive Leaflet map showing Razia Driving
/*  Center location, free 2km pick-up zone (PLUS Plan), and 10km max
/*  service radius. Uses OpenStreetMap tiles (free, no API key needed).
/* ------------------------------------------------------------------ */
import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import { MapPin } from "lucide-react";

// Razia Driving Center — 28/A, S Block, Gulberg 2, Lahore
const CENTER = [31.5204, 74.3587];

// Gulberg sub-areas (approximate centroids)
const GULBERG_AREAS = [
  { name: "Gulberg 1", pos: [31.5145, 74.3490] },
  { name: "Gulberg 2", pos: CENTER },
  { name: "Gulberg 3", pos: [31.5260, 74.3670] },
];

// Fix Leaflet default marker icons (broken with bundlers)
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const originIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Fit map bounds to show both circles on mount. */
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([
      [CENTER[0] - 0.09, CENTER[1] - 0.09],
      [CENTER[0] + 0.09, CENTER[1] + 0.09],
    ]);
  }, [map]);
  return null;
}

export default function ServiceAreaMap() {
  return (
    <section id="service-area" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-orange-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#FF6201]">
            Service Area
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 md:text-4xl">
            Where We Pick &amp; Drop
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Free pick-up &amp; drop within 2 KM on the <span className="font-semibold text-gray-700">PLUS Plan</span>. Available up to 10 KM
            across Lahore.
          </p>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            2 KM Free (PLUS Plan)
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 rounded-full bg-orange-400" />
            2–10 KM (Charged)
          </span>
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Our Center
          </span>
        </div>

        {/* Map */}
        <div className="mt-8 overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100">
          <MapContainer
            center={CENTER}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: "460px", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds />

            {/* 10 KM max service radius */}
            <Circle
              center={CENTER}
              radius={10000}
              pathOptions={{
                color: "#fb923c",
                fillColor: "#fb923c",
                fillOpacity: 0.06,
                weight: 2,
                dashArray: "6 4",
              }}
            />

            {/* 2 KM free pick-up radius (PLUS Plan) */}
            <Circle
              center={CENTER}
              radius={1000}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />

            {/* Center marker */}
            <Marker position={CENTER} icon={originIcon}>
              <Popup>
                <strong>Razia Driving Center</strong>
                <br />
                28/A, S Block, Gulberg 2, Lahore
              </Popup>
            </Marker>

            {/* Gulberg area markers */}
            {GULBERG_AREAS.map((area) => (
              <Marker
                key={area.name}
                position={area.pos}
                icon={defaultIcon}
              >
                <Popup>{area.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Gulberg area pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {GULBERG_AREAS.map((area) => (
            <span
              key={area.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-100"
            >
              <MapPin size={11} className="text-[#FF6201]" />
              {area.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
