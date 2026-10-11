import { useState, useEffect, useRef } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "../router";

import logo from "../assets/logo-white.png";

const SERVICE_ROUTES = ["/driving-school-gulberg-lahore/", "/driving-school-gulberg-lahore"];

function Navbar({ onBookNow }) {
  const { route, navigateToSection } = useRouter();
  const isServicePage = SERVICE_ROUTES.includes(route);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const guidesRef = useRef(null);
  const guidesTimeout = useRef(null);

  const guideLinks = [
    { name: "Driving School in Gulberg", href: "/driving-school-gulberg-lahore/" },
    { name: "Driving School in DHA", href: "/driving-school-dha-lahore/" },
    { name: "Driving School in Johar Town", href: "/driving-school-johar-town-lahore/" },
    { name: "Driving School in Model Town", href: "/driving-school-model-town-lahore/" },
    { name: "Female Driving Instructor", href: "/female-driving-instructor-lahore/" },
    { name: "Practical Driving Lessons", href: "/practical-driving-lessons-lahore/" },
    { name: "Advanced Driving Lessons", href: "/advanced-driving-lahore/" },
    { name: "Free Driving Guide", href: "/free-driving-guide-lahore/" },
    { name: "Driving Courses & Prices", href: "/driving-courses-lahore/" },
    { name: "How to Learn Driving", href: "/blog/how-to-learn-driving-lahore/" },
    { name: "Manual vs Automatic", href: "/blog/manual-vs-automatic-car/" },
    { name: "Pass Driving Test", href: "/blog/pass-driving-test-lahore/" },
    { name: "Driving Tips for Beginners", href: "/blog/driving-tips-beginners-lahore/" },
    { name: "Driving Course Cost", href: "/blog/driving-course-cost-lahore/" },
    { name: "Apply Learner License Online", href: "/blog/how-to-apply-learner-license-online-punjab/" },
  ];

  const handleGuidesEnter = () => {
    clearTimeout(guidesTimeout.current);
    setGuidesOpen(true);
  };

  const handleGuidesLeave = () => {
    guidesTimeout.current = setTimeout(() => setGuidesOpen(false), 150);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guidesRef.current && !guidesRef.current.contains(e.target)) {
        setGuidesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When on the service page, nav links should navigate to homepage sections.
  // On the homepage, the standard anchor href works as-is.
  const handleNavClick = (e, sectionId) => {
    if (isServicePage) {
      e.preventDefault();
      navigateToSection(sectionId);
    }
  };

  useEffect(() => {
    const sections = [
      "home",
      "courses",
      "reviews",
      "about",
      "contact",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    sections.forEach((id) => {
      const section = document.getElementById(id);

      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Courses", href: "#courses" },
    { name: "Reviews", href: "#reviews" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      {/* Navbar — orange gradient, white text */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#FF3131] to-[#FF6201]"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

          {/* Brand */}
          <a
            href={isServicePage ? "/" : "#home"}
            onClick={(e) => handleNavClick(e, "home")}
            className="flex items-center gap-2 leading-tight"
          >
            <img
              src={logo}
              alt="Razia Driving Center"
              className="h-8 w-8 rounded-full object-contain"
            />

            <span className="flex flex-col">
              <span className="text-base font-extrabold text-white">
                Razia Driving Center
              </span>
              <span className="text-[11px] font-medium text-white/80">
                Learn Today. Drive Forever.
              </span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={isServicePage ? "/" + link.href : link.href}
                onClick={(e) => handleNavClick(e, link.href.slice(1))}
                className={`
                  relative
                  text-sm
                  font-medium
                  transition-colors
                  duration-200
                  hover:text-white
                  ${activeSection === link.href.slice(1) ? "text-white" : "text-white/80"}
                `}
              >
                {link.name}
              </a>
            ))}

            {/* Learn & Guides Dropdown */}
            <div
              ref={guidesRef}
              className="relative"
              onMouseEnter={handleGuidesEnter}
              onMouseLeave={handleGuidesLeave}
            >
              <button
                onClick={() => setGuidesOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white"
                aria-expanded={guidesOpen}
                aria-haspopup="true"
              >
                Learn &amp; Guides
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${guidesOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {guidesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 top-full mt-3 w-[480px] -translate-x-1/2 rounded-xl bg-white p-5 shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {guideLinks.map((link) => (
                        <a
                          key={link.name}
                          href={link.href}
                          onClick={() => setGuidesOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#FF6201]"
                        >
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">

            {/* Book Now */}
            <button
              onClick={onBookNow}
              className="
                hidden
                md:inline-flex
                items-center
                justify-center
                rounded-full
                bg-white
                px-4
                py-2
                text-xs
                font-bold
                text-[#FF3131]
                transition-transform
                duration-200
                hover:-translate-y-0.5
              "
            >
              Book Now
            </button>

            {/* WhatsApp Pill */}
            <a
              href="https://wa.me/923094461407"
              target="_blank"
              rel="noreferrer"
              className="
                hidden
                md:inline-flex
                items-center
                justify-center
                rounded-full
                bg-[#25D366]
                px-4
                py-2
                text-xs
                font-bold
                text-white
                transition-transform
                duration-200
                hover:-translate-y-0.5
              "
            >
              WhatsApp
            </a>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="rounded-lg p-2 text-white transition hover:bg-white/15 md:hidden"
            >
              <Menu size={26} />
            </button>

          </div>

        </div>

      </motion.nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden">

          <div className="absolute right-0 h-full w-72 bg-white p-8 shadow-2xl">

            {/* Close Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-8 text-2xl font-bold transition hover:text-[#FF6201]"
            >
              ✕
            </button>

            {/* Menu Links */}
            <div className="flex flex-col gap-3 text-lg font-semibold">

              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={isServicePage ? "/" + link.href : link.href}
                  onClick={(e) => { handleNavClick(e, link.href.slice(1)); setMenuOpen(false); }}
                  className="rounded-lg px-3 py-2 text-gray-800 transition-all duration-200 hover:translate-x-1 hover:bg-orange-50 hover:text-[#FF6201]"
                >
                  {link.name}
                </a>
              ))}

              {/* Mobile Learn & Guides */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setGuidesOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-bold text-gray-900"
                  aria-expanded={guidesOpen}
                >
                  Learn &amp; Guides
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${guidesOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {guidesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 pb-2">
                        {guideLinks.map((link) => (
                          <a
                            key={link.name}
                            href={link.href}
                            onClick={() => { setMenuOpen(false); setGuidesOpen(false); }}
                            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-orange-50 hover:text-[#FF6201]"
                          >
                            {link.name}
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile WhatsApp */}
              <a
                href="https://wa.me/923094461407"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white"
              >
                Chat on WhatsApp
              </a>

              {/* Mobile Book Button */}
              <button
                onClick={() => { onBookNow(); setMenuOpen(false); }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] px-5 py-2.5 text-sm font-bold text-white"
              >
                Book a Course
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default Navbar;
