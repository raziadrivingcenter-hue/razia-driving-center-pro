import CustomSelect from "./CustomSelect";
import BookingCourseCard from "./BookingCourseCard";
import BookingSummary from "./BookingSummary";

function BookingStep2({
  formData,
  setFormData,
  next,
  back,
}) {
  const isCustomCourse = formData.course === "Custom Course";

  return (
    <div className="px-5 pb-5 pt-4">

      {/* Booking Summary */}
      <BookingSummary formData={formData} />

      {/* Heading */}

      <h2 className="text-3xl font-black">
        Choose Your Course
      </h2>

      <p className="mt-2 text-gray-500">
        Select the training package that suits you best.
      </p>

      {/* Course Cards */}

      <div className="mt-6 space-y-4">

        {isCustomCourse ? (

          <BookingCourseCard
            title="✨ Custom Driving Course"
            description={`${formData.customDays} Days • ${formData.customMinutes} Minutes Daily`}
            price={`Rs. ${Number(
              formData.customPrice
            ).toLocaleString()}`}
            selected={true}
            onClick={() => {}}
          />

        ) : (

          <>
            <BookingCourseCard
              title="Economy Driving Course"
              description="Perfect for first-time learners."
              price="Rs. 14,500"
              selected={
                formData.course ===
                "Economy Driving Course"
              }
              onClick={() =>
                setFormData({
                  ...formData,
                  course: "Economy Driving Course",
                })
              }
            />

            <BookingCourseCard
              title="Pro Driver Course"
              description="Advanced driving in real Lahore traffic."
              price="Rs. 26,500"
              selected={
                formData.course ===
                "Pro Driver Course"
              }
              onClick={() =>
                setFormData({
                  ...formData,
                  course: "Pro Driver Course",
                })
              }
            />

            <BookingCourseCard
              title="Own Vehicle Training"
              description="Learn using your own vehicle."
              price="Rs. 13,989"
              selected={
                formData.course ===
                "Own Vehicle Training"
              }
              onClick={() =>
                setFormData({
                  ...formData,
                  course: "Own Vehicle Training",
                })
              }
            />
          </>

        )}

      </div>

      {/* Pick & Drop */}

      <div className="mt-6">

        <CustomSelect
          label="Do you require Pick & Drop service?"
          value={formData.pickup}
          onChange={(e) =>
            setFormData({
              ...formData,
              pickup: e.target.value,
            })
          }
          options={[
            "Select Option",
            "Yes",
            "No",
          ]}
        />

        {formData.pickup === "Yes" && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-orange-200
              bg-orange-50
              p-4
            "
          >
            <p className="font-semibold text-[#FF6201]">
              🚗 Pick & Drop Service
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Pick & Drop charges are calculated
              based on your location within Lahore.
              Our team will confirm the exact
              transportation charges after reviewing
              your booking request.
            </p>
          </div>
        )}

      </div>

      {/* Navigation */}

      <div className="mt-8 flex items-center justify-between">

        <button
          type="button"
          onClick={back}
          className="
            rounded-xl
            border
            border-gray-300
            px-6
            py-3
            font-semibold
            transition
            hover:bg-gray-100
          "
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!formData.course}
          className="
            rounded-xl
            bg-gradient-to-r
            from-[#FF3131]
            to-[#FF6201]
            px-8
            py-3
            font-bold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
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