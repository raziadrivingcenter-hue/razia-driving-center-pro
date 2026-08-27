import { AnimatePresence, motion } from "framer-motion";
import { MapPin, ChevronDown, ChevronUp, CarFront, XCircle } from "lucide-react";
import { useState } from "react";

import CustomSelect from "./CustomSelect";
import BookingInput from "./BookingInput";
import BookingCourseCard from "./BookingCourseCard";
import BookingSummary from "./BookingSummary";
import { useCountUp } from "../../hooks/useCountUp";
import { courses } from "../../data/courses";
import { courseVariantMap } from "../../data/courseCardVariants";

function BookingStep2({
  formData,
  setFormData,
  pricing,
  next,
  back,
}) {
  const isCustomCourse = formData.course === "Custom Course";

  // Animated numeric values for the Pick & Drop calculation card.
  const animCourseFee = useCountUp(pricing.courseFee);
  const animDistance = useCountUp(pricing.distanceKm);
  const animFreeDistance = useCountUp(pricing.freeDistanceKm);
  const animChargeable = useCountUp(pricing.chargeableDistanceKm);
  const animPickDrop = useCountUp(pricing.pickDropCharges);
  const animTotal = useCountUp(pricing.totalPayable);

  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [showCalculation, setShowCalculation] = useState(false);

  const handleCheckDistance = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location detection."
      );
      return;
    }

    setLocationError("");
    setLocationStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setLocationStatus("opening");

        const directionsUrl =
          `https://www.google.com/maps/dir/?api=1` +
          `&origin=${latitude},${longitude}` +
          `&destination=31.5201889,74.3575145`;

        window.open(directionsUrl, "_blank", "noopener,noreferrer");

        setTimeout(() => setLocationStatus("idle"), 1500);
      },
      (error) => {
        setLocationStatus("idle");

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access is required to check your distance. Please allow location access and try again."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Location detection timed out. Please try again."
            );
            break;
          case error.POSITION_UNAVAILABLE:
          default:
            setLocationError(
              "Your current location could not be detected. Please try again."
            );
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="rounded-b-2xl border border-white/25 bg-white/[0.07] px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl">

      {/* Booking Summary */}
      <BookingSummary formData={formData} />

      {/* Heading */}

      <h2 className="mt-4 text-lg font-black text-white">
        Choose Your Course
      </h2>

      <p className="mt-0.5 text-xs text-gray-300">
        Select the training package that suits you best.
      </p>

      {/* Course Cards */}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">

        {isCustomCourse ? (

          <BookingCourseCard
            title="✨ Custom Driving Course"
            price={`Rs. ${Number(
              formData.customPrice
            ).toLocaleString()}`}
            duration={`${formData.customDays} Days`}
            detail={`${formData.customMinutes} MINUTES DAILY TRAINING`}
            variant="silver"
            selected={true}
            onClick={() => {}}
          />

        ) : (

          <>
            {courses.slice(0, 3).map((course) => {
              // Explicit detail line if set, else first feature uppercased.
              const firstFeature = course.features?.[0];
              const firstFeatureText =
                typeof firstFeature === "string"
                  ? firstFeature
                  : firstFeature?.text ?? "";
              const detail = (course.detail ?? firstFeatureText).toUpperCase();

              // "10 Days Training" -> "10 DAYS"
              const durationDays = course.duration
                ? course.duration.replace(/^(.*days).*$/i, "$1").trim().toUpperCase()
                : "";

              return (
                <BookingCourseCard
                  key={course.name}
                  title={course.title}
                  oldPrice={course.oldPrice}
                  price={course.price}
                  duration={durationDays}
                  detail={detail}
                  variant={courseVariantMap[course.title] ?? "silver"}
                  badge={course.badge}
                  selected={formData.course === course.name}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      course: course.name,
                    })
                  }
                />
              );
            })}
          </>

        )}

      </div>

      {/* Pick & Drop */}

      <div className="mt-4">

        <CustomSelect
          label="Do you require Pick & Drop service?"
          value={formData.pickup}
          onChange={(e) => {
            const value = e.target.value;

            setFormData({
              ...formData,
              pickup: value,
              address: value === "Yes" ? formData.address : "",
            });
          }}
          options={[
            "Select Option",
            "Yes",
            "No",
          ]}
        />

        <AnimatePresence>
          {formData.pickup === "Yes" && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div className="pt-3">

                <BookingInput
                  label="Pickup / Drop-off Address"
                  placeholder="Enter your complete pickup address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: e.target.value,
                    })
                  }
                  icon={MapPin}
                  success={formData.address.trim().length >= 5}
                  error={
                    formData.address.trim().length > 0 &&
                    formData.address.trim().length < 5
                      ? "Please enter a complete address."
                      : ""
                  }
                />

                <p className="mt-2 text-[11px] text-gray-300">
                  Calculate Your Self
                </p>

                <div className="mt-2 flex items-end gap-2">

                  <BookingInput
                    label="Distance In KM"
                    placeholder="e.g. 5"
                    value={formData.distance}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(
                        /[^0-9.]/g,
                        ""
                      );

                      const parts = onlyNumbers.split(".");

                      const sanitized =
                        parts.length > 2
                          ? parts[0] + "." + parts.slice(1).join("")
                          : onlyNumbers;

                      setFormData({
                        ...formData,
                        distance: sanitized,
                      });
                    }}
                    success={
                      Number(formData.distance) > 0 &&
                      Number(formData.distance) <= 20
                    }
                    error={
                      Number(formData.distance) > 20
                        ? "Sorry, Pick & Drop Service is available up to 20 KM."
                        : ""
                    }
                    errorIcon={XCircle}
                    hideErrorText
                  />

                  <button
                    type="button"
                    onClick={handleCheckDistance}
                    disabled={locationStatus !== "idle"}
                    className="
                      flex
                      h-[42px]
                      w-[130px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-r
                      from-[#FF3131]
                      to-[#FF6201]
                      text-sm
                      font-semibold
                      text-white
                      shadow-md
                      transition-all
                      duration-300
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      disabled:hover:translate-y-0
                    "
                  >
                    {locationStatus === "idle"
                      ? "Check Distance"
                      : locationStatus === "locating"
                      ? "Getting your location..."
                      : "Opening Google Maps..."}
                  </button>

                </div>

                {Number(formData.distance) > 20 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
                    <XCircle size={12} className="shrink-0 text-red-400" />
                    Sorry, Pick & Drop Service is available up to 20 KM.
                  </p>
                )}

                {locationError && (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {locationError}
                  </p>
                )}

                {pricing.courseFee > 0 && (
                  <div className="mt-3 rounded-xl border border-white/20 bg-white/[0.07] p-3 backdrop-blur-md">

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        Selected Course Fee
                      </span>
                      <span className="text-sm font-bold text-gray-100">
                        Rs. {Math.round(animCourseFee).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        Distance
                      </span>
                      <span className="text-sm font-bold text-gray-100">
                        {Math.round(animDistance)} KM
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        Free Distance
                      </span>
                      <span className="text-sm font-bold text-green-400">
                        {Math.round(animFreeDistance)} KM — FREE
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        Chargeable Distance
                      </span>
                      <span className="text-sm font-bold text-gray-100">
                        {Math.round(animChargeable)} KM
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-300">
                        Pick & Drop Charges
                      </span>
                      <span className="text-sm font-bold text-gray-100">
                        Rs. {Math.round(animPickDrop).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2 border-t border-white/20 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          Total Payable
                        </span>
                        <span className="text-base font-black text-[#FF6201]">
                          Rs. {Math.round(animTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] leading-4 text-gray-400">
                      You only pay for the distance beyond 2 KM.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setShowCalculation((prev) => !prev)
                      }
                      className="
                        mt-2
                        flex
                        items-center
                        gap-1
                        text-[11px]
                        font-semibold
                        text-[#FF6201]
                        transition
                        hover:underline
                      "
                    >
                      Estimated Pick & Drop Charge
                      {showCalculation ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>

                    <AnimatePresence>
                      {showCalculation && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="mt-1 text-[11px] leading-5 text-gray-300">
                            First {pricing.freeDistanceKm} KM are FREE. Remaining distance is charged at Rs. {pricing.ratePerKm.toLocaleString()}/KM.
                          </p>
                          <p className="text-[11px] font-semibold text-gray-200">
                            {pricing.chargeableDistanceKm} KM × Rs. {pricing.ratePerKm.toLocaleString()} = Rs.{" "}
                            {pricing.pickDropCharges.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[10px] leading-4 text-gray-400">
                            Final charges are verified by our team
                            before booking confirmation.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                )}

              </div>

              <div
                className="
                  mt-3
                  rounded-xl
                  border
                  border-white/20
                  bg-white/[0.07]
                  px-3
                  py-2.5
                  backdrop-blur-md
                "
              >
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#FF6201]">
                  <CarFront size={14} className="shrink-0 text-[#FF6201]" />
                  Pick & Drop Service
                </p>

                <p className="mt-0.5 text-[11px] leading-4 text-gray-300">
                  Our team will verify your distance and
                  confirm the exact Pick & Drop charges
                  with you before booking confirmation.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Navigation */}

      <div className="mt-5 flex items-center justify-between">

        <button
          type="button"
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
          type="button"
          onClick={next}
          disabled={
            !formData.course ||
            Number(formData.distance) > 20 ||
            (formData.pickup === "Yes" &&
              formData.address.trim().length < 5)
          }
          className="
            h-[42px]
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-6
            text-sm
            font-bold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-xl
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Continue →
        </button>

      </div>

    </div>
  );
}

export default BookingStep2;
