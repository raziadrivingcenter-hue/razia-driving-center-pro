import { User, Phone, MapPin, CarFront } from "lucide-react";

function BookingLiveSummary({ formData }) {
  return (
    <div
      className="
        rounded-xl
        border
        border-orange-100
        bg-gradient-to-r
        from-orange-50
        to-white
        p-3
        shadow-sm
      "
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6201]">
        Live Booking Summary
      </p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">

        <div className="flex items-center gap-2">
          <User size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm">
            {formData.name || "Your Name"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm">
            {formData.phone || "Phone Number"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm">
            {formData.area || "Your Area"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CarFront size={14} className="shrink-0 text-[#FF6201]" />
          <span className="truncate text-sm">
            {formData.course || "Course Not Selected"}
          </span>
        </div>

      </div>

    </div>
  );
}

export default BookingLiveSummary;
