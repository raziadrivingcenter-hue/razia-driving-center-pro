import { CheckCircle2, LoaderCircle, CalendarDays } from "lucide-react";
import { useState } from "react";

import CustomSelect from "./CustomSelect";
import BookingInput from "./BookingInput";
import { supabase } from "../../lib/supabase";

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
      alert("Please select a driving course.");
      return;
    }

    if (!formData.time) {
      alert("Please select your preferred training time.");
      return;
    }

    setError("");
    setLoading(true);

    const message = formData.notes.trim() || null;

    const extra =
      formData.course === "Custom Course"
        ? {
            custom_days: formData.customDays,
            custom_minutes: formData.customMinutes,
            custom_price: formData.customPrice,
            course_fee: pricing.courseFee,
            pick_drop_charges: pricing.pickDropCharges,
            total_payable: pricing.totalPayable,
          }
        : {
            course_fee: pricing.courseFee,
            pick_drop_charges: pricing.pickDropCharges,
            total_payable: pricing.totalPayable,
          };

    const { data, error: supabaseError } = await supabase.rpc(
      "submit_booking",
      {
        p_customer_name: formData.name.trim(),
        p_customer_phone: formData.phone.trim(),
        p_customer_email: formData.email.trim() || null,
        p_preferred_course: formData.course,
        p_message: message,
        p_source: window.location.hostname || null,
        p_area: formData.area.trim() || null,
        p_city: null,
        p_address:
          formData.pickup === "Yes"
            ? formData.address.trim() || null
            : null,
        p_preferred_date: formData.preferred_date || null,
        p_preferred_time: formData.time || null,
        p_pickup_location: null,
        p_dropoff_location: null,
        p_distance_km:
          formData.pickup === "Yes"
            ? Number(formData.distance) || null
            : null,
        p_home_service: formData.pickup === "Yes",
        p_extra: extra,
      }
    );

    if (supabaseError) {
      setLoading(false);

      if (import.meta.env.DEV) {
        console.error("Booking submission failed:", supabaseError.message);
      }

      setError(
        "Sorry, we couldn't submit your booking right now. Please try again."
      );
      return;
    }

    setLoading(false);
    setBookingId(String(data).slice(0, 8));
    setShowConfirmation(true);
  };

  const handleInformWhatsApp = () => {
    const whatsappMessage =
      `Hello Razia Driving Center Team\n\n` +
      `I Have Submitted My details Through your Website\n\n` +
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
          Your Details Has Been Sent Successfully
        </h2>

        <p className="mt-3 text-sm font-semibold text-[#FF6201]">
          Booking ID # {bookingId}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              border
              border-white/25
              px-5
              py-2.5
              text-sm
              font-semibold
              text-gray-200
              transition
              hover:bg-white/10
            "
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleInformWhatsApp}
            className="
              h-[42px]
              rounded-xl
              bg-gradient-to-r
              from-[#FF3131]
              to-[#FF6201]
              px-5
              text-sm
              font-bold
              text-white
              shadow-lg
              transition
              hover:-translate-y-0.5
              hover:shadow-xl
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

      {/* Compact Booking Summary */}
      <div className="rounded-xl border border-white/20 bg-white/[0.07] p-3 backdrop-blur-md">

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300">
            Course
          </span>
          <span className="text-sm font-bold text-gray-100">
            {formData.course}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">
            Pick & Drop
          </span>
          <span className="text-sm font-bold text-gray-100">
            {formData.pickup || "-"}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">
            Course Fee
          </span>
          <span className="text-sm font-bold text-gray-100">
            Rs. {pricing.courseFee.toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">
            Pick & Drop Charges
          </span>
          <span className="text-sm font-bold text-gray-100">
            Rs. {pricing.pickDropCharges.toLocaleString()}
          </span>
        </div>

        <div className="mt-2 border-t border-white/20 pt-2">

          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white">
              Total Payable
            </span>
            <span className="text-base font-black text-[#FF6201]">
              Rs. {pricing.totalPayable.toLocaleString()}
            </span>
          </div>

        </div>

      </div>

      <h2 className="mt-4 text-lg font-black text-white">
        Final Step
      </h2>

      <p className="mt-0.5 text-xs text-gray-300">
        Just a few more details before booking.
      </p>

      {/* Preferred Time */}

      <div className="mt-4">

        <CustomSelect
          label="Preferred Training Time"
          value={formData.time}
          onChange={(e) =>
            setFormData({
              ...formData,
              time: e.target.value,
            })
          }
          options={[
            "Select Time",
            "Morning (8 AM - 12 PM)",
            "Afternoon (12 PM - 4 PM)",
            "Evening (4 PM - 8 PM)",
          ]}
        />

      </div>

      {/* Preferred Joining Date */}

      <div className="mt-3">

        <BookingInput
          label="Preferred Joining Date"
          type="date"
          value={formData.preferred_date}
          onChange={(e) =>
            setFormData({
              ...formData,
              preferred_date: e.target.value,
            })
          }
          icon={CalendarDays}
        />

      </div>

      {/* Notes */}

      <div className="mt-3">

        <label className="mb-1 block text-sm font-semibold text-gray-300">
          Additional Notes
        </label>

        <textarea
          rows="3"
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value,
            })
          }
          placeholder="Anything you'd like us to know..."
          className="
            w-full
            rounded-xl
            border
            border-white/20
            bg-white/[0.08]
            p-3
            text-sm
            text-gray-100
            placeholder-white/40
            resize-none
            outline-none
            backdrop-blur-sm
            transition
            focus:border-[#FF6201]
            focus:ring-4
            focus:ring-[#FF6201]/20
          "
        />

      </div>

      {/* Error */}

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 p-2.5 text-center text-sm font-medium text-red-300">
          {error}
        </div>
      )}

      {/* Buttons */}

      <div className="mt-5 flex items-center justify-between">

        <button
          onClick={back}
          className="
            rounded-xl
            border
            border-white/25
            px-5
            py-2.5
            text-sm
            font-semibold
            text-gray-200
            transition
            hover:bg-white/10
          "
        >
          ← Back
        </button>

        <button
          onClick={handleBooking}
          disabled={loading}
          className="
            flex
            h-[42px]
            min-w-[180px]
            items-center
            justify-center
            gap-3
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-6
            text-sm
            font-bold
            text-white
            shadow-lg
            transition
            hover:-translate-y-0.5
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-70
            disabled:hover:translate-y-0
          "
        >

          {loading ? (
            <div className="flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              <span className="text-xs">Submitting...</span>
            </div>
          ) : (
            <span>Confirm</span>
          )}

        </button>

      </div>

    </div>
  );
}

export default BookingStep3;
