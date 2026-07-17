import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
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
                    Gulberg, Lahore, Pakistan
                  </p>
                </div>

              </div>

              {/* Hours */}
              <div className="group flex items-center gap-5 rounded-2xl p-3 transition hover:bg-orange-50">

                <div className="rounded-full bg-orange-100 p-4 transition group-hover:scale-110">
                  <Clock className="text-[#FF6201]" />
                </div>

                <div>
                  <h4 className="font-bold">
                    Working Hours
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

          {/* Right Side */}
          <div className="rounded-3xl bg-white p-10 shadow-xl">

            <h3 className="text-3xl font-black">
              Send a Message
            </h3>

            <p className="mt-3 text-gray-500">
              Fill out the form and we'll contact you shortly.
            </p>

            <form className="mt-8 space-y-6">

              <input
                type="text"
                placeholder="Your Name"
                className="w-full rounded-xl border border-gray-300 p-4 transition outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-200"
              />

              <input
                type="email"
                placeholder="Your Email"
                className="w-full rounded-xl border border-gray-300 p-4 transition outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-200"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full rounded-xl border border-gray-300 p-4 transition outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-200"
              />

              <textarea
                rows="5"
                placeholder="Your Message"
                className="w-full rounded-xl border border-gray-300 p-4 transition outline-none focus:border-[#FF6201] focus:ring-2 focus:ring-orange-200"
              ></textarea>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF3131] to-[#FF6201] py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                Send Message

                <Send
                  size={18}
                  className="transition group-hover:translate-x-1"
                />

              </button>

            </form>

          </div>

        </div>

      </div>
    </section>
  );
}

export default Contact;