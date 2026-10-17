import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useRouter } from "../router";
import { cn } from "../lib/utils";
import rdcLogo from "../assets/LOGORDC.svg";

const SERVICE_ROUTES = ["/driving-school-gulberg-lahore/", "/driving-school-gulberg-lahore"];

function Navbar({ onBookNow }) {
  const { route, navigate, navigateToSection } = useRouter();
  const isServicePage = SERVICE_ROUTES.includes(route);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [mobileGuidesOpen, setMobileGuidesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const guidesRef = useRef(null);
  const guidesTimeout = useRef(null);

  /* ── resizable-on-scroll ── */
  const navRef = useRef(null);
  const { scrollY } = useScroll({
    target: navRef,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) setVisible(true);
    else setVisible(false);
  });

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

  const handleNavClick = (e, sectionId) => {
    if (isServicePage) {
      e.preventDefault();
      navigateToSection(sectionId);
    }
  };

  // Active-section tracking via IntersectionObserver
  useEffect(() => {
    const sections = ["home", "courses", "reviews", "about", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.5 }
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
      <style>{`
        .nav-btn-book {
          background: #111; color: #fff; border-radius: 9999px;
          padding: 8px 20px; font-size: 13px; font-weight: 600;
          transition: background 0.2s ease; white-space: nowrap;
        }
        .nav-btn-book:hover { background: #333; }
        @media (max-width: 768px) { .nav-btn-book { padding: 6px 14px; font-size: 12px; } }
      `}</style>

      {/* ── sticky scroll container ── */}
      <motion.nav
        ref={navRef}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-x-0 top-4 z-50 w-full"
      >
        {/* ════════ DESKTOP (≥lg) ════════ */}
        <motion.div
          animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            boxShadow: visible
              ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
              : "none",
            width: visible ? "60%" : "100%",
            y: visible ? 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 50 }}
          style={{ minWidth: "820px" }}
          className={cn(
            "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full px-4 py-2 lg:flex",
            visible
              ? "border border-gray-200 bg-white/80"
              : "border border-transparent bg-transparent"
          )}
        >
          {/* Left — RDC logo + branding */}
          <a
            href={isServicePage ? "/" : "#home"}
            onClick={(e) => handleNavClick(e, "home")}
            className="flex shrink-0 items-center gap-2.5 transition-transform hover:scale-105"
            aria-label="Razia Driving Center — Home"
          >
            <img src={rdcLogo} alt="Razia Driving Center" width="40" height="40" />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">Razia Driving Center</span>
          </a>

          {/* Center — text links */}
          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={isServicePage ? "/" + link.href : link.href}
                onClick={(e) => handleNavClick(e, link.href.slice(1))}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-200",
                  activeSection === link.href.slice(1)
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {link.name}
              </a>
            ))}

            {/* Learn & Guides dropdown */}
            <div
              ref={guidesRef}
              className="relative"
              onMouseEnter={handleGuidesEnter}
              onMouseLeave={handleGuidesLeave}
            >
              <button
                onClick={() => setGuidesOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900"
                aria-expanded={guidesOpen}
                aria-haspopup="true"
              >
                Learn &amp; Guides
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform duration-200",
                    guidesOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {guidesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 top-full mt-3 w-[480px] -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-5 shadow-2xl"
                  >
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {guideLinks.map((link) => (
                        <a
                          key={link.name}
                          href={link.href}
                          onClick={() => setGuidesOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                        >
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Book a Slot */}
            <button
              onClick={() => navigate("/slot-availability")}
              className={cn(
                "hidden rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 lg:inline-block",
                route === "/slot-availability"
                  ? "text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Book a Slot
            </button>
          </div>

          {/* Right — Book Now + mobile toggle */}
          <div className="flex items-center gap-2">
            <button onClick={onBookNow} className="nav-btn-book">
              Book Now
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>

        {/* ════════ MOBILE (<lg) ════════ */}
        <motion.div
          animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            boxShadow: visible
              ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
              : "none",
            width: visible ? "92%" : "100%",
            paddingRight: visible ? "12px" : "0px",
            paddingLeft: visible ? "12px" : "0px",
            borderRadius: visible ? "24px" : "9999px",
            y: visible ? 10 : 0,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 50 }}
          className={cn(
            "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-row items-center justify-between rounded-full px-4 py-2 lg:hidden",
            visible
              ? "border border-gray-200 bg-white/80"
              : "border border-gray-200 bg-white"
          )}
        >
          {/* Left — RDC logo + branding */}
          <a
            href={isServicePage ? "/" : "#home"}
            onClick={(e) => handleNavClick(e, "home")}
            className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105"
            aria-label="Razia Driving Center — Home"
          >
            <img src={rdcLogo} alt="Razia Driving Center" width="40" height="40" />
            <span className="text-[14px] font-bold tracking-tight text-gray-900">Razia Driving Center</span>
          </a>

          {/* Right — Book Now + toggle */}
          <div className="flex items-center gap-2">
            <button onClick={onBookNow} className="nav-btn-book">
              Book Now
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.div>
      </motion.nav>

      {/* ════════ MOBILE SIDE PANEL ════════ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute right-0 flex h-full w-80 max-w-[85vw] flex-col bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile header */}
              <div className="mb-6 flex items-center justify-between">
                <img src={rdcLogo} alt="Razia Driving Center" width="40" height="40" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={isServicePage ? "/" + link.href : link.href}
                    onClick={(e) => {
                      handleNavClick(e, link.href.slice(1));
                      setMenuOpen(false);
                    }}
                    className="rounded-lg px-3 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    {link.name}
                  </a>
                ))}

                {/* Book a Slot */}
                <button
                  onClick={() => {
                    navigate("/slot-availability");
                    setMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-50"
                >
                  Book a Slot
                </button>

                {/* Learn & Guides accordion */}
                <div className="mt-1">
                  <button
                    onClick={() => setMobileGuidesOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800"
                    aria-expanded={mobileGuidesOpen}
                  >
                    Learn &amp; Guides
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition-transform duration-200",
                        mobileGuidesOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {mobileGuidesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-0.5 pb-2 pl-2">
                          {guideLinks.map((link) => (
                            <a
                              key={link.name}
                              href={link.href}
                              onClick={() => {
                                setMenuOpen(false);
                                setMobileGuidesOpen(false);
                              }}
                              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
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

              <div className="flex-1" />

              {/* Mobile Book Now */}
              <button
                onClick={() => { onBookNow(); setMenuOpen(false); }}
                className="nav-btn-book w-full py-3 text-base"
              >
                Book Now
              </button>

              {/* Mobile WhatsApp */}
              <a
                href="https://wa.me/923094461407"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Chat on WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
