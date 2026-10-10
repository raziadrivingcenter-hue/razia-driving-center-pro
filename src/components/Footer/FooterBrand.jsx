import {
  CheckCircle,
  MapPin,
  Clock,
  Car,
} from "lucide-react";

function FooterBrand() {
  return (
    <div>

      <h2 className="text-2xl font-black text-white">
        Razia Driving Center
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-[1.5] text-gray-400">
        Helping Lahore learn driving with confidence since 2016 through
        professional one-to-one driving lessons with a female instructor.
      </p>

      <div className="mt-4 space-y-2.5">

        <div className="flex items-center gap-3">

          <CheckCircle
            size={20}
            className="text-[#FF6201]"
          />

          <span className="text-gray-300">
            Female Driving Instructor
          </span>

        </div>

        <div className="flex items-center gap-3">

          <Car
            size={20}
            className="text-[#FF6201]"
          />

          <span className="text-gray-300">
            Real Traffic Training
          </span>

        </div>

        <div className="flex items-center gap-3">

          <Clock
            size={20}
            className="text-[#FF6201]"
          />

          <span className="text-gray-300">
            Flexible Training Timings
          </span>

        </div>

        <div className="flex items-center gap-3">

          <MapPin
            size={20}
            className="text-[#FF6201]"
          />

          <span className="text-gray-300">
            Gulberg 2, Lahore
          </span>

        </div>

      </div>

    </div>
  );
}

export default FooterBrand;