import { CheckCircle2, LoaderCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

import { submitBooking } from "../../lib/bookingApi";
import { getPlanType } from "../../lib/pickDropCalculator";

function BookingStep3({
  formData,
  setFormData,
  pricing,
  back,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState("");

  const handleBooking = async () => {
    if (!formData.course) {
      setError("Please select a driving course.");
      return;
    }

    if (!formData.slot_time) {
      setError("Please select a time slot.");
      return;
    }

    if (!formData.preferred_date) {
      setError("Please select a start date.");
      return;
    }

    setError("");
    setLoading(true);

    // Map course name → plan_type for the API
    const planType = getPlanType(formData.course) || "basic";

    // Duration days from course config
    const durationDays = pricing.durationDays || 7;

    const bookingPayload = {
      customer_name: formData.name.trim(),
      phone_number: formData.phone.trim(),
      slot_time: formData.slot_time,
      course_start_date: formData.preferred_date,
      duration_days: durationDays,
      plan_type: planType,
      distance_km: formData.pickup === "Yes" ? Number(formData.distance) || 0 : 0,
      pickup_address: formData.pickup === "Yes" ? formData.address.trim() || null : null,
      area: formData.area.trim() || null,
      course_fee: pricing.courseFee,
      distance_fee: pricing.pickDropCharges,
      total_fee: pricing.totalPayable,
      notes: formData.notes.trim() || null,
      source: "website",
    };

    try {
      const result = await submitBooking(bookingPayload);

      setLoading(false);
      setBookingId(result.bookingId);
      setShowConfirmation(true);
    } catch (err) {
      setLoading(false);

      if (err.code === "SLOT_CONFLICT") {
        setError(
          "This time slot was just booked by someone else. Please go back and pick a different date or time."
        );
        return;
      }

      if (err.code === "VALIDATION_ERROR") {
        setError(err.details?.join(", ") || "Please check your input and try again.");
        return;
      }

      setError("Sorry, we couldn't submit your booking right now. Please try again.");
    }
  };

  const handleInformWhatsApp = () => {
    const whatsappMessage =
      `Hello Razia Driving Center Team\n\n` +
      `I have submitted my booking through your website\n\n` +
      `My Booking ID # ${bookingId}`;

    const whatsappURL =
      `https://wa.me/923094461407?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappURL, "_blank");
  };

  if (showConfirmation) {
    return (
      <div className="px-6 py-8 text-center">

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>

        <h2 className="text-xl font-black text-white">
          Booking Submitted Successfully!
        </h2>

        <p className="mt-2 text-sm text-gray-300">
          Your driving course has been reserved.
        </p>

        <p className="mt-3 text-sm font-semibold text-[#FF6201]">
          Booking ID # {bookingId}
        </p>

        {formData.slot_time && (
          <p className="mt-2 text-xs text-gray-400">
            Slot: {formData.slot_time} every day for {pricing.durationDays} days
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold
              text-gray-200 transition hover:bg-white/10
            "
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleInformWhatsApp}
            className="
              h-[42px] rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201]
              px-5 text-sm font-bold text-white shadow-lg transition
              hover:-translate-y-0.5 hover:shadow-xl
            "
          >
            Inform on WhatsApp
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="rounded-b-2xl border border-white/25 bg-white/[0.07] px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl">

      {/* Booking Summary */}

      <div className="rounded-xl border border-white/20 bg-white/[0.07] p-3 backdrop-blur-md">

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">Course</span>
          <span className="text-sm font-bold text-gray-100">{formData.course}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">Start Date</span>
          <span className="text-sm font-bold text-gray-100">
            {formData.preferred_date
              ? new Date(formData.preferred_date).toLocaleDateString("en-PK", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "-"}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">Slot Time</span>
          <span className="text-sm font-bold text-gray-100">{formData.slot_time || "-"}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">Duration</span>
          <span className="text-sm font-bold text-gray-100">{pricing.durationDays} Days</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">Pick & Drop</span>
          <span className="text-sm font-bold text-gray-100">{formData.pickup || "-"}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">Course Fee</span>
          <span className="text-sm font-bold text-gray-100">
            Rs. {pricing.courseFee.toLocaleString()}
          </span>
        </div>

        {pricing.pickDropCharges > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-300">Pick & Drop Charges</span>
            <span className="text-sm font-bold text-gray-100">
              Rs. {pricing.pickDropCharges.toLocaleString()}
            </span>
          </div>
        )}

        <div className="mt-2 border-t border-white/20 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white">Total Payable</span>
            <span className="text-base font-black text-[#FF6201]">
              Rs. {pricing.totalPayable.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* Notes */}

      <div className="mt-4">
        <label className="mb-1 block text-sm font-semibold text-gray-300">
          Additional Notes (Optional)
        </label>

        <textarea
          rows="3"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Anything you'd like us to know..."
          className="
            w-full rounded-xl border border-white/20 bg-white/[0.08] p-3 text-sm text-gray-100
            placeholder-white/40 resize-none outline-none backdrop-blur-sm transition
            focus:border-[#FF6201] focus:ring-4 focus:ring-[#FF6201]/20
          "
        />
      </div>

      {/* Error */}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-500/10 p-2.5 text-sm font-medium text-red-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Buttons */}

      <div className="mt-5 flex items-center justify-between">

        <button
          onClick={back}
          className="
            rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold
            text-gray-200 transition hover:bg-white/10
          "
        >
          ← Back
        </button>

        <button
          onClick={handleBooking}
          disabled={loading}
          className="
            flex h-[42px] min-w-[180px] items-center justify-center gap-3 rounded-xl
            bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-6 text-sm font-bold
            text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl
            disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0
          "
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              <span className="text-xs">Submitting...</span>
            </div>
          ) : (
            <span>Confirm Booking</span>
          )}
        </button>

      </div>

    </div>
  );
}

export default BookingStep3;
