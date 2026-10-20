/* ------------------------------------------------------------------ */
/*  ServiceAreaMap — interactive Leaflet map showing Razia Driving
/*  Center location, free 2km pick-up zone (PLUS Plan), and 20km max
/*  service radius. Uses OpenStreetMap tiles (free, no API key needed).
/* ------------------------------------------------------------------ */
import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import { MapPin } from "lucide-react";

// Razia Driving Center — 28/A, S Block, Gulberg 2, Lahore
const CENTER = [31.5204, 74.3587];

// Confirmed service areas across Lahore (pick-up within 20 km of the office).
// Text-only list — no per-area coordinates are asserted.
const AREAS = [
  "Gulberg 1", "Gulberg 2", "Gulberg 3", "Falcon Complex", "Makka Colony",
  "Calvary Ground", "Gulbahar Colony", "Madina Colony", "Walton", "Askari 5",
  "Shah Jamal", "Ghalib Road", "Canal Park", "Fazlia Colony", "Shadman 1",
  "Upper Mall Scheme", "Mian Mir Colony", "CMA Colony", "Super Town",
  "New Super Town", "Model Town", "Muslim Town", "Faisal Town",
  "Rehmanpura Colony", "Ichhra", "Shershah Colony", "DHA Phase 1",
  "DHA Phase 2", "DHA Phase 3", "DHA Phase 4", "Nishat Colony",
  "Shami Road Cantt", "Tufail Road Cantt", "R.A. Bazar Cantt", "Saddar Town Cantt",
];

// Fix Leaflet default marker icons (broken with bundlers)
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
            Free pick-up &amp; drop within 2 KM on the <span className="font-semibold text-gray-700">PLUS Plan</span>. Available up to 20 KM
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
            2–20 KM (Charged)
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

            {/* 20 KM max service radius */}
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

          </MapContainer>
        </div>

        {/* Confirmed service areas — text list, no per-area coordinates asserted */}
        <div className="mt-6 flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-100"
            >
              <MapPin size={11} className="text-[#FF6201]" />
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
