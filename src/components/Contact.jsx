import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";

function Contact() {
  return (
    <section
      id="contact"
      data-aos="fade-up"
      className="bg-gradient-to-b from-gray-50 to-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* Heading */}
        <div className="text-center">

          <h2 className="text-5xl font-black">
            Contact Us
          </h2>

          <p className="mt-5 text-lg text-gray-500">
            Ready to become a confident driver? Contact us today and start
            learning with Lahore's trusted female driving instructor.
          </p>

        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">

          {/* Left Side */}
          <div className="rounded-3xl bg-white p-10 shadow-xl">

            <h3 className="text-3xl font-black">
              Razia Driving Center
            </h3>

            <p className="mt-5 leading-8 text-gray-600">
              We have trained thousands of successful drivers across Lahore.
              Learn confidently with one-on-one practical driving lessons in
              real traffic conditions.
            </p>

            <div className="mt-10 space-y-6">

              {/* Phone */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Phone className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Phone
                  </h4>

                  <p className="text-gray-600">
                    +92 309 4461407
                  </p>
                </div>

              </div>

              {/* Email */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Mail className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Email
                  </h4>

                  <p className="text-gray-600">
                    raziadrivingcenter@gmail.com
                  </p>
                </div>

              </div>

              {/* Location */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <MapPin className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Location
                  </h4>

                  <p className="text-gray-600">
                    28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan
                  </p>
                </div>

              </div>

              {/* Consultation & Customer Support Hours */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Clock className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Consultation &amp; Customer Support
                  </h4>

                  <p className="text-gray-600">
                    Monday - Sunday
                  </p>

                  <p className="text-gray-600">
                    7:00 AM – 12:00 AM
                  </p>

                </div>

              </div>

              {/* Driving Training Hours */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Clock className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Driving Training
                  </h4>

                  <p className="text-gray-600">
                    Monday - Sunday
                  </p>

                  <p className="text-gray-600">
                    8:00 AM – 8:00 PM
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Right Side — direct contact actions (replaces the dead form) */}
          <div className="rounded-3xl bg-white p-10 shadow-xl">

            <h3 className="text-3xl font-black">
              Get in Touch Directly
            </h3>

            <p className="mt-3 text-gray-500">
              Call, message, or email us — we respond quickly during consultation
              hours (7 AM – 12 AM, 7 days a week).
            </p>

            <div className="mt-8 space-y-4">

              {/* Call */}
              <a
                href="tel:+923094461407"
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-[#FF6201] hover:bg-orange-50"
              >
                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Phone className="text-[#FF6201]" />
                </div>
                <div>
                  <h4 className="font-bold">
                    Call Us
                  </h4>
                  <p className="text-gray-600">
                    +92 309 4461407
                  </p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/923094461407"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-[#25D366] hover:bg-green-50"
              >
                <div className="rounded-full bg-green-100 p-4 transition group-hover:scale-110">
                  <MessageCircle className="text-[#25D366]" />
                </div>
                <div>
                  <h4 className="font-bold">
                    WhatsApp
                  </h4>
                  <p className="text-gray-600">
                    Chat with us instantly
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:raziadrivingcenter@gmail.com"
                className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 transition hover:border-[#FF6201] hover:bg-orange-50"
              >
                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Mail className="text-[#FF6201]" />
                </div>
                <div>
                  <h4 className="font-bold">
                    Email Us
                  </h4>
                  <p className="text-gray-600">
                    raziadrivingcenter@gmail.com
                  </p>
                </div>
              </a>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Contact;