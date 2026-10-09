import {
  Phone,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";

function FooterLinks() {
  return (
    <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">

      {/* Explore */}

      <div>

        <h3 className="mb-6 text-xl font-bold text-white">
          Explore
        </h3>

        <ul className="space-y-4">

          <li>
            <a
              href="#home"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#courses"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Courses
            </a>
          </li>

          <li>
            <a
              href="#instructor"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Instructor
            </a>
          </li>

          <li>
            <a
              href="#gallery"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Gallery
            </a>
          </li>

          <li>
            <a
              href="#faq"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              FAQ
            </a>
          </li>

          <li>
            <a
              href="#contact"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Contact
            </a>
          </li>

          <li>
            <a
              href="#location"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Location & Directions
            </a>
          </li>

        </ul>

      </div>

      {/* Learn & Guides */}

      <div>

        <h3 className="mb-6 text-xl font-bold text-white">
          Learn &amp; Guides
        </h3>

        <ul className="space-y-4">

          <li>
            <a
              href="/driving-school-gulberg-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving School in Gulberg
            </a>
          </li>

          <li>
            <a
              href="/female-driving-instructor-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Female Driving Instructor
            </a>
          </li>

          <li>
            <a
              href="/practical-driving-lessons-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Practical Driving Lessons
            </a>
          </li>

          <li>
            <a
              href="/advanced-driving-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Advanced Driving Lessons
            </a>
          </li>

          <li>
            <a
              href="/free-driving-guide-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Free Driving Guide
            </a>
          </li>

        </ul>

      </div>

      {/* Get in Touch */}

      <div>

        <h3 className="mb-6 text-xl font-bold text-white">
          Get in Touch
        </h3>

        <div className="space-y-5">

          <div className="flex items-start gap-3">

            <Phone
              size={20}
              className="mt-1 text-[#FF6201]"
            />

            <span className="text-gray-400">
              +92 309 4461407
            </span>

          </div>

          <div className="flex items-start gap-3">

            <Mail
              size={20}
              className="mt-1 text-[#FF6201]"
            />

            <span className="text-gray-400 break-all">
              raziadrivingcenter@gmail.com
            </span>

          </div>

          <div className="flex items-start gap-3">

            <MapPin
              size={20}
              className="mt-1 text-[#FF6201]"
            />

            <span className="text-gray-400">
              28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan
            </span>

          </div>

          <div className="flex items-start gap-3">

            <Clock
              size={20}
              className="mt-1 text-[#FF6201]"
            />

            <span className="text-gray-400">
              Training 8 AM – 8 PM | Consultation 7 AM – 12 AM
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FooterLinks;