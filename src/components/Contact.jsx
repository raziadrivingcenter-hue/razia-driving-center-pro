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
      className="bg-gradient-to-b from-gray-50 to-white py-8 md:py-10"
    >
      <div className="mx-auto max-w-6xl px-6">

        {/* Heading */}
        <div className="text-center">

          <h2 className="text-2xl font-black leading-[1.2] md:text-3xl">
            Contact Us
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Ready to become a confident driver? Contact us today and start
            learning with Lahore's trusted female driving instructor.
          </p>

        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Left Side */}

          <div className="rounded-xl bg-white p-4 shadow-md">

            <h3 className="text-lg font-black">
              Razia Driving Center
            </h3>

            <p className="mt-2 text-sm leading-[1.45] text-gray-600">
              We have trained thousands of successful drivers across Lahore.
              Learn confidently with one-on-one practical driving lessons in
              real traffic conditions.
            </p>

            <div className="mt-4 space-y-2.5">

              {/* Phone */}

              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-2">
                  <Phone size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Phone
                  </h4>

                  <p className="text-xs text-gray-600">
                    +92 309 4461407
                  </p>
                </div>

              </div>

              {/* Email */}

              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-2">
                  <Mail size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Email
                  </h4>

                  <p className="text-xs text-gray-600">
                    raziadrivingcenter@gmail.com
                  </p>
                </div>

              </div>

              {/* Location */}

              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-2">
                  <MapPin size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Location
                  </h4>

                  <p className="text-xs text-gray-600">
                    28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan
                  </p>
                </div>

              </div>

              {/* Consultation & Customer Support Hours */}

              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-2">
                  <Clock size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Consultation &amp; Customer Support
                  </h4>

                  <p className="text-xs text-gray-600">
                    Monday - Sunday · 7:00 AM – 12:00 AM
                  </p>
                </div>

              </div>

              {/* Driving Training Hours */}

              <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-2">
                  <Clock size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Driving Training
                  </h4>

                  <p className="text-xs text-gray-600">
                    Monday - Sunday · 8:00 AM – 8:00 PM
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Right Side — direct contact actions (replaces the dead form) */}

          <div className="rounded-xl bg-white p-4 shadow-md">

            <h3 className="text-lg font-black">
              Get in Touch Directly
            </h3>

            <p className="mt-1.5 text-xs text-gray-500">
              Call, message, or email us — we respond quickly during consultation
              hours (7 AM – 12 AM, 7 days a week).
            </p>

            <div className="mt-4 space-y-2.5">

              {/* Call */}

              <a
                href="tel:+923094461407"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-[#FF6201] hover:bg-orange-50"
              >
                <div className="rounded-full bg-orange-100 p-2">
                  <Phone size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Call Us
                  </h4>
                  <p className="text-xs text-gray-600">
                    +92 309 4461407
                  </p>
                </div>
              </a>

              {/* WhatsApp */}

              <a
                href="https://wa.me/923094461407"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-[#25D366] hover:bg-green-50"
              >
                <div className="rounded-full bg-green-100 p-2">
                  <MessageCircle size={16} className="text-[#25D366]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    WhatsApp
                  </h4>
                  <p className="text-xs text-gray-600">
                    Chat with us instantly
                  </p>
                </div>
              </a>

              {/* Email */}

              <a
                href="mailto:raziadrivingcenter@gmail.com"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition hover:border-[#FF6201] hover:bg-orange-50"
              >
                <div className="rounded-full bg-orange-100 p-2">
                  <Mail size={16} className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="text-xs font-bold">
                    Email Us
                  </h4>
                  <p className="text-xs text-gray-600">
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
