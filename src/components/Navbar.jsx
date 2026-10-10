import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "../router";

import logo from "../assets/logo-white.png";

const SERVICE_ROUTES = ["/driving-school-gulberg-lahore/", "/driving-school-gulberg-lahore"];

function Navbar({ onBookNow }) {
  const { route, navigateToSection } = useRouter();
  const isServicePage = SERVICE_ROUTES.includes(route);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

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
