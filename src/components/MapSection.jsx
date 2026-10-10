import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
} from "lucide-react";

function MapSection() {
  return (
    <section
      id="location"
      data-aos="fade-up"
      className="bg-white py-8 md:py-10"
    >
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}

        <div className="text-center">

          <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-[#FF6201]">
            Visit Us
          </span>

          <h2 className="mt-2 text-2xl font-black leading-[1.2] md:text-3xl">
            Find Razia Driving Center
          </h2>

          <p className="mt-1.5 text-sm text-gray-500">
            Visit our office or start navigation directly from Google Maps.
          </p>

        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Left Side */}

          <div className="space-y-3">

            <div className="rounded-xl bg-gray-50 p-3 shadow-sm">

              <div className="flex items-start gap-3">

                <div className="rounded-lg bg-orange-100 p-2">
                  <MapPin size={18} className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-sm font-bold">
                    Address
                  </h3>

                  <p className="mt-0.5 text-xs leading-snug text-gray-600">
                    28/A, S Block, Gulberg 2,
                    <br />
                    Lahore, 54660, Pakistan
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-gray-50 p-3 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-orange-100 p-2">
                  <Phone size={18} className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-sm font-bold">
                    Phone
                  </h3>

                  <p className="text-xs text-gray-600">
                    +92 309 4461407
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-gray-50 p-3 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-orange-100 p-2">
                  <Mail size={18} className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-sm font-bold">
                    Email
                  </h3>

                  <p className="text-xs text-gray-600">
                    raziadrivingcenter@gmail.com
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-gray-50 p-3 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-orange-100 p-2">
                  <Clock size={18} className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-sm font-bold">
                    Consultation &amp; Customer Support
                  </h3>

                  <p className="text-xs text-gray-600">
                    Monday – Sunday · 7:00 AM – 12:00 AM
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-xl bg-gray-50 p-3 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-orange-100 p-2">
                  <Clock size={18} className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-sm font-bold">
                    Driving Training
                  </h3>

                  <p className="text-xs text-gray-600">
                    Monday – Sunday · 8:00 AM – 8:00 PM
                  </p>

                </div>

              </div>

            </div>

            <a
              href="https://www.google.com/maps/dir//28+S+Block,+Razia+Driving+Center,+Plot,+2+Gulberg+Rd,+Block+S+Gulberg+2,+Lahore,+54660,+Pakistan/@31.5077711,74.3470166,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3919058cfa714f95:0x4628296acb17c69e!2m2!1d74.3575145!2d31.5201889"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Navigation size={16} />
              Get Directions
            </a>

          </div>

          {/* Right Side */}

          <div className="overflow-hidden rounded-xl shadow-lg">

            <iframe
              title="Razia Driving Center Location"
              src="https://www.google.com/maps?q=31.5201889,74.3575145&z=16&output=embed"
              width="100%"
              height="400"
              loading="lazy"
              className="border-0"
              allowFullScreen
            ></iframe>

          </div>

        </div>

      </div>
    </section>
  );
}

export default MapSection;
