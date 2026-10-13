import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock3, LoaderCircle, AlertTriangle, CarFront } from "lucide-react";

import { fetchAvailability } from "../../lib/bookingApi";

function BookingStep2Slot({ formData, setFormData, pricing, next, back }) {
  const [selectedDate, setSelectedDate] = useState(formData.preferred_date || "");
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(formData.slot_time || "");
  const [selectedVehicle, setSelectedVehicle] = useState(formData.vehicle_id || "");

  // Minimum date = today, max = +30 days
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setVehicles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetchAvailability(selectedDate)
      .then((data) => {
        if (cancelled) return;
        setSlots(data.availableSlots || []);
        setVehicles(data.vehicles || []);

        if (!data.synced && data.availableCount === 0) {
          setError("No schedule synced for this date yet. Try another date or contact us.");
        } else if (data.availableCount === 0) {
          setError("No slots available on this date. Please pick another.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load slots.");
        setSlots([]);
        setVehicles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot("");
    setSelectedVehicle("");
    setFormData({ ...formData, preferred_date: date, slot_time: "", vehicle_id: "" });
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot.time);
    setSelectedVehicle(slot.vehicle_id);
    setFormData({
      ...formData,
      slot_time: slot.time,
      vehicle_id: slot.vehicle_id,
      vehicle_name: slot.vehicle_name,
    });
  };

  const canContinue = selectedDate && selectedSlot;

  return (
    <div className="rounded-b-2xl border border-white/25 bg-white/[0.07] px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl">

      {/* Heading */}

      <h2 className="mt-2 text-lg font-black text-white">
        Pick Date & Time
      </h2>

      <p className="mt-0.5 text-xs text-gray-300">
        Choose your preferred start date and training slot.
      </p>

      {/* Date Picker */}

      <div className="mt-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
          <CalendarDays size={14} className="text-[#FF6201]" />
          Start Date
        </label>

        <input
          type="date"
          min={today}
          max={maxDate}
          value={selectedDate}
          onChange={handleDateChange}
          className="
            w-full rounded-xl border border-white/20 bg-white/[0.08] p-3 text-sm text-gray-100
            outline-none backdrop-blur-sm transition focus:border-[#FF6201]
            focus:ring-4 focus:ring-[#FF6201]/20
          "
        />
      </div>

      {/* Slot Grid */}

      {selectedDate && (
        <div className="mt-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-300">
            <Clock3 size={14} className="text-[#FF6201]" />
            Available Slots
            {slots.length > 0 && (
              <span className="ml-auto text-xs font-normal text-gray-400">
                {slots.length} available
              </span>
            )}
          </label>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-300">
              <LoaderCircle size={16} className="animate-spin" />
              Loading slots...
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-3 text-sm text-yellow-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                {error}
                <br />
                <span className="text-xs text-yellow-400/70">
                  Or WhatsApp us at +92 309 4461407 to check availability.
                </span>
              </span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              <AnimatePresence>
                {slots.map((slot, idx) => (
                  <motion.button
                    key={`${slot.time}-${slot.vehicle_id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.03 }}
                    onClick={() => handleSlotSelect(slot)}
                    className={`
                      w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-200
                      ${
                        selectedSlot === slot.time && selectedVehicle === slot.vehicle_id
                          ? "border-[#FF6201] bg-[#FF6201] text-white shadow-lg"
                          : "border-white/20 bg-white/[0.06] text-gray-200 hover:border-[#FF6201]/50 hover:bg-white/[0.12]"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{slot.display}</span>
                      {slot.vehicle_name && (
                        <span className={`flex items-center gap-1 text-[10px] ${selectedSlot === slot.time && selectedVehicle === slot.vehicle_id ? "text-white/80" : "text-gray-400"}`}>
                          <CarFront size={10} />
                          {slot.vehicle_name}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}

      <div className="mt-5 flex items-center justify-between">

        <button
          type="button"
          onClick={back}
          className="
            rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-gray-200
            transition hover:bg-white/10
          "
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className="
            h-[42px] rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201]
            px-6 text-sm font-bold text-white shadow-lg transition-all duration-300
            hover:-translate-y-0.5 hover:shadow-xl
            disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0
          "
        >
          Continue →
        </button>

      </div>

    </div>
  );
}

export default BookingStep2Slot;
