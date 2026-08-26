import { User, Phone, MapPin, CarFront } from "lucide-react";

function BookingLiveSummary({ formData }) {
  return (
    <div
      className="
        rounded-xl
        border
        border-white/20
        bg-white/[0.07]
        p-3
        shadow-sm
        backdrop-blur-md
      "
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6201]">
        Live Booking Summary
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">

        <div className="flex items-center gap-2">
          <User size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm text-gray-100">
            {formData.name || "Your Name"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm text-gray-100">
            {formData.phone || "Phone Number"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm text-gray-100">
            {formData.area || "Your Area"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CarFront size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm text-gray-100">
            {formData.course || "Course Not Selected"}
          </span>
        </div>

      </div>

    </div>
  );
}

export default BookingLiveSummary;
