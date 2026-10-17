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

          <li>
            <a
              href="/privacy-policy/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Privacy Policy
            </a>
          </li>

          <li>
            <a
              href="/terms/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Terms of Service
            </a>
          </li>

          <li>
            <a
              href="/payment-procedure/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Payment Procedure
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

          <li>
            <a
              href="/driving-courses-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving Courses &amp; Prices
            </a>
          </li>

          <li>
            <a
              href="/driving-school-dha-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving School in DHA
            </a>
          </li>

          <li>
            <a
              href="/driving-school-johar-town-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving School in Johar Town
            </a>
          </li>

          <li>
            <a
              href="/driving-school-model-town-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving School in Model Town
            </a>
          </li>

          <li>
            <a
              href="/blog/how-to-learn-driving-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              How to Learn Driving
            </a>
          </li>

          <li>
            <a
              href="/blog/driving-course-cost-lahore/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving Course Cost
            </a>
          </li>

          <li>
            <a
              href="/blog/how-to-apply-learner-license-online-punjab/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Apply Learner License Online
            </a>
          </li>

          <li>
            <a
              href="/driving-test-practice/"
              className="text-gray-400 transition hover:text-[#FF6201]"
            >
              Driving Test Practice Game
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
              <span className="font-dm-sans">+92 309 4461407</span>
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
              28/A, S Block, Gulberg 2, Lahore, <span className="font-dm-sans">54660</span>, Pakistan
            </span>

          </div>

          <div className="flex items-start gap-3">

            <Clock
              size={20}
              className="mt-1 text-[#FF6201]"
            />

            <span className="text-gray-400">
              Training <span className="font-dm-sans">8</span> AM – <span className="font-dm-sans">8</span> PM | Consultation <span className="font-dm-sans">7</span> AM – <span className="font-dm-sans">12</span> AM
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FooterLinks;