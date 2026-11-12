import { CheckCircle2 } from "lucide-react";

import { formatTime12 } from "../../lib/ownVehicleSlots";

// One 30-minute grid cell. Colours and meanings match /slot-availability:
// available = green, booked = red, traveling = yellow, advance = grey.
// A green cell that cannot host the whole lesson is shown disabled with the
// label "Not enough free time".
export default function SlotTile({ slot, entry, selected, selectable, onSelect }) {
  const status = entry?.status || "empty";
  const label = formatTime12(slot);

  if (status === "available") {
    if (selected) {
      return (
        <button
          type="button"
          onClick={() => onSelect(slot)}
          aria-pressed="true"
          title={`${label} — selected`}
          className="flex items-center justify-between rounded-lg border border-green-600 bg-green-600 px-3 py-2 text-left transition hover:bg-green-700"
        >
          <span className="font-dm-sans truncate text-sm font-semibold text-white">
            {label}
          </span>
          <CheckCircle2 size={16} className="shrink-0 text-white" />
        </button>
      );
    }

    if (!selectable) {
      return (
        <div
          aria-disabled="true"
          title="Not enough free time"
          className="cursor-not-allowed rounded-lg border border-green-200 bg-green-50 px-3 py-2 opacity-60"
        >
          <div className="flex items-center justify-between">
            <span className="font-dm-sans truncate text-sm font-semibold text-green-700">
              {label}
            </span>
          </div>
          <span className="mt-0.5 block text-[10px] font-medium text-gray-400">
            Not enough free time
          </span>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onSelect(slot)}
        aria-pressed="false"
        className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-left transition hover:border-green-300 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6201]/40"
      >
        <span className="font-dm-sans truncate text-sm font-semibold text-green-700">
          {label}
        </span>
        <span className="shrink-0 rounded-full bg-green-200/60 px-2 py-0.5 text-[10px] font-bold text-green-700">
          Book
        </span>
      </button>
    );
  }

  if (status === "booked") {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <span
            className="font-dm-sans truncate text-sm font-medium text-red-700"
            title={label}
          >
            {label}
          </span>
          <span className="shrink-0 rounded-full bg-red-200/60 px-2 py-0.5 text-[10px] font-bold text-red-700">
            Booked
          </span>
        </div>
      </div>
    );
  }

  if (status === "travel") {
    const travelLabel = entry.area ? `Traveling to ${entry.area}` : "Traveling";
    return (
      <div
        title={travelLabel}
        className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2"
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-dm-sans truncate text-sm font-medium text-yellow-700"
            title={label}
          >
            {label}
          </span>
          <span
            className="shrink-0 rounded-full bg-yellow-200/70 px-2 py-0.5 text-[10px] font-bold text-yellow-700"
            title={travelLabel}
          >
            Traveling
          </span>
        </div>
      </div>
    );
  }

  if (status === "advance") {
    return (
      <div
        aria-disabled="true"
        className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-dm-sans truncate text-sm font-medium text-gray-500"
            title={label}
          >
            {label}
          </span>
          <span className="shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
            Advance
          </span>
        </div>
        <span className="mt-0.5 block text-[10px] font-semibold text-red-600">
          Booked In Advance
        </span>
      </div>
    );
  }

  // empty — no vehicle operating this cell
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 font-dm-sans text-sm text-gray-300">
      {label}
      <span className="ml-1 text-xs">—</span>
    </div>
  );
}
