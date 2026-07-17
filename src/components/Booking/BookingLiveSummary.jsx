import { User, Phone, MapPin, CarFront } from "lucide-react";

function BookingLiveSummary({ formData }) {
  return (
    <div
      className="
      mb-5
      rounded-2xl
      border
      border-orange-100
      bg-gradient-to-r
      from-orange-50
      to-white
      p-4
      shadow-sm
    "
    >
      <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#FF6201]">
        Live Booking Summary
      </p>

      <div className="space-y-3">

        <div className="flex items-center gap-3">
          <User size={17} className="text-[#FF6201]" />
          <span className="text-sm">
            {formData.name || "Your Name"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Phone size={17} className="text-[#FF6201]" />
          <span className="text-sm">
            {formData.phone || "Phone Number"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <MapPin size={17} className="text-[#FF6201]" />
          <span className="text-sm">
            {formData.area || "Your Area"}
          </span>
        </div>

        <div className="border-t border-orange-100 pt-3">

          <div className="flex items-center gap-3">
            <CarFront size={17} className="text-[#FF6201]" />

            <div>

              <p className="font-semibold">
                {formData.course || "Course Not Selected"}
              </p>

              {formData.course === "Custom Course" && (
                <p className="text-sm text-gray-500">
                  {formData.customDays} Days • {formData.customMinutes} Minutes
                </p>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default BookingLiveSummary;