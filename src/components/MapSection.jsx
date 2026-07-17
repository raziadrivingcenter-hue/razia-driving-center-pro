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
      className="bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="text-center">

          <span className="rounded-full bg-orange-100 px-4 py-2 font-semibold text-[#FF6201]">
            Visit Us
          </span>

          <h2 className="mt-6 text-5xl font-black">
            Find Razia Driving Center
          </h2>

          <p className="mt-4 text-lg text-gray-500">
            Visit our office or start navigation directly from Google Maps.
          </p>

        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">

          {/* Left Side */}

          <div className="space-y-6">

            <div className="rounded-3xl bg-gray-50 p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl">

              <div className="flex items-start gap-4">

                <div className="rounded-2xl bg-orange-100 p-4">
                  <MapPin className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="text-xl font-bold">
                    Address
                  </h3>

                  <p className="mt-2 text-gray-600 leading-7">
                    Plot 28/a, S Block,
                    <br />
                    Gulberg II,
                    <br />
                    Lahore, Pakistan
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl bg-gray-50 p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl">

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-orange-100 p-4">
                  <Phone className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="font-bold">
                    Phone
                  </h3>

                  <p className="text-gray-600">
                    +92 309 4461407
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl bg-gray-50 p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl">

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-orange-100 p-4">
                  <Mail className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="font-bold">
                    Email
                  </h3>

                  <p className="text-gray-600">
                    raziadrivingcenter@gmail.com
                  </p>

                </div>

              </div>

            </div>

            <div className="rounded-3xl bg-gray-50 p-6 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl">

              <div className="flex items-center gap-4">

                <div className="rounded-2xl bg-orange-100 p-4">
                  <Clock className="text-[#FF6201]" />
                </div>

                <div>

                  <h3 className="font-bold">
                    Working Hours
                  </h3>

                  <p className="text-gray-600">
                    Monday – Sunday
                  </p>

                  <p className="text-gray-600">
                    8:00 AM – 8:00 PM
                  </p>

                </div>

              </div>

            </div>

            <a
              href="https://www.google.com/maps/dir//28+S+Block,+Razia+Driving+Center,+Plot,+2+Gulberg+Rd,+Block+S+Gulberg+2,+Lahore,+54660,+Pakistan/@31.5077711,74.3470166,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3919058cfa714f95:0x4628296acb17c69e!2m2!1d74.3575145!2d31.5201889"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-8 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl"
            >
              <Navigation size={20} />
              Get Directions
            </a>

          </div>

          {/* Right Side */}

          <div className="overflow-hidden rounded-3xl shadow-2xl">

            <iframe
              title="Razia Driving Center Location"
              src="https://www.google.com/maps?q=31.5201889,74.3575145&z=16&output=embed"
              width="100%"
              height="600"
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