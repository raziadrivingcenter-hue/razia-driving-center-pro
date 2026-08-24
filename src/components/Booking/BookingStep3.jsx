import BookingSummary from "./BookingSummary";

import { CheckCircle2 } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import CustomSelect from "./CustomSelect";
import { supabase } from "../../lib/supabase";

function BookingStep3({
  formData,
  setFormData,
  back,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
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
    setLoadingStep(1);

    // --- Build WhatsApp message (existing business message) ---

    let courseDetails = "";

    if (formData.course === "Custom Course") {
      courseDetails = `
🚘 Course:
Custom Driving Course

📅 Training Days:
${formData.customDays} Days

⏱ Lesson Duration:
${formData.customMinutes} Minutes Daily

💰 Estimated Fee:
Rs. ${Number(formData.customPrice).toLocaleString()}
`;
    } else {
      courseDetails = `
🚘 Course:
${formData.course}
`;
    }

    const emailLine = formData.email.trim()
      ? `

📧 Email:
${formData.email.trim()}`
      : "";

    const whatsappMessage = `Hello Razia Driving Center,

🚗 New Website Booking

👤 Name:
${formData.name}

📞 Phone:
${formData.phone}${emailLine}

📍 Area:
${formData.area}

${courseDetails}

🚖 Pick & Drop:
${formData.pickup}

🕒 Preferred Training Time:
${formData.time}

📝 Additional Notes:
${formData.notes || "None"}

Please contact me.`;

    // --- Build the stored message (customer free-text notes only) ---

    const message = formData.notes.trim() || null;

    // --- Custom course data (website-specific, kept in extra) ---

    const extra =
      formData.course === "Custom Course"
        ? {
            custom_days: formData.customDays,
            custom_minutes: formData.customMinutes,
            custom_price: formData.customPrice,
          }
        : null;

    // --- Save to Supabase (Phase 2 structured schema) ---

    const { error: supabaseError } = await supabase
      .from("booking_requests")
      .insert({
        customer_name: formData.name.trim(),
        customer_phone: formData.phone.trim(),
        customer_email: formData.email.trim() || null,
        preferred_course: formData.course,
        message,

        source: window.location.hostname || null,
        area: formData.area.trim() || null,
        city: null,
        address:
          formData.pickup === "Yes"
            ? formData.address.trim() || null
            : null,
        preferred_date: null,
        preferred_time: formData.time || null,
        pickup_location: null,
        dropoff_location: null,
        distance_km:
          formData.pickup === "Yes"
            ? Number(formData.distance) || null
            : null,
        home_service: formData.pickup === "Yes",
        extra,
        status: "pending",
      });

    if (supabaseError) {
      setLoading(false);
      setLoadingStep(0);

      if (import.meta.env.DEV) {
        console.error("Booking submission failed:", supabaseError.message);
      }

      setError(
        "Sorry, we couldn't submit your booking right now. Please try again."
      );
      return;
    }

    // --- Supabase succeeded -> continue the existing WhatsApp flow ---

    setLoadingStep(2);

    setTimeout(() => {
      setLoadingStep(3);
    }, 700);

    const whatsappURL =
      `https://wa.me/923094461407?text=${encodeURIComponent(whatsappMessage)}`;

    setTimeout(() => {
      setShowSuccess(true);

      window.open(whatsappURL, "_blank");

      setTimeout(() => {
        setLoading(false);
        setLoadingStep(0);
        setShowSuccess(false);
        onClose();
      }, 1800);
    }, 1400);
  };

  if (showSuccess) {
    return (
      <div className="px-6 py-8 text-center">

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">

          <CheckCircle2
            size={40}
            className="text-green-600"
          />

        </div>

        <h2 className="text-xl font-black">
          Booking Submitted!
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Booking request submitted successfully. We'll contact you shortly.
        </p>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-200">

          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201]" />

        </div>

        <p className="mt-4 text-xs text-gray-400">
          Please don't close this window.
        </p>

      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-3">

      {/* Booking Summary */}

      <BookingSummary formData={formData} />

      <h2 className="mt-4 text-lg font-black">
        Final Step
      </h2>

      <p className="mt-0.5 text-xs text-gray-500">
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

      {/* Notes */}

      <div className="mt-3">

        <label className="mb-1 block text-sm font-semibold text-gray-800">
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
            border-gray-200
            p-3
            text-sm
            resize-none
            outline-none
            transition
            focus:border-[#FF6201]
            focus:ring-4
            focus:ring-orange-100
          "
        />

      </div>

      {/* Error */}

      {error && (
        <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-2.5 text-center text-sm font-medium text-red-600">
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
            px-5
            py-2.5
            text-sm
            font-semibold
            transition
            hover:bg-gray-100
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

            <div className="flex flex-col items-start gap-1.5">

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 1
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 1 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                <span className="text-xs">
                  Checking Details...
                </span>

              </div>

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 2
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 2 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <div className="h-4 w-4" />
                )}

                <span className="text-xs">
                  Preparing Booking...
                </span>

              </div>

              <div
                className={`flex items-center gap-2 ${
                  loadingStep >= 3
                    ? "text-white"
                    : "text-white/60"
                }`}
              >

                {loadingStep >= 3 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <div className="h-4 w-4" />
                )}

                <span className="text-xs">
                  Opening WhatsApp...
                </span>

              </div>

            </div>

          ) : (

            <>
              <span>Book on WhatsApp</span>
            </>

          )}

        </button>

      </div>

    </div>
  );
}

export default BookingStep3;
