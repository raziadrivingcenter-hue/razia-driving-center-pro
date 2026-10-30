import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "../router";
import { cn } from "../lib/utils";
import rdcLogo from "../assets/LOGORDC.svg";
import googleLogo from "../assets/google-logo.png";
import CustomerSignup from "./CustomerSignup";
import { getSession, signOut, onAuthStateChange } from "../lib/auth";


/* Smart floating navbar constants */
const SCROLL_THRESHOLD = 100;      // px before floating mode activates
const SCROLL_IGNORE = 8;           // px jitter threshold
const AUTO_HIDE_MS = 5000;         // auto-hide after 5s
const SQUEEZE_SCALE = 0.82;        // horizontal compression when hidden
const ANIM_DURATION = 0.22;        // show/hide animation duration (s)
const TOP_HOVER_ZONE = 28;          // px from top that triggers hover-reveal

function Navbar({ onBookNow }) {
  const { route, navigate, navigateToSection } = useRouter();
  const isHomepage = route === "/" || route === "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [mobileGuidesOpen, setMobileGuidesOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const guidesRef = useRef(null);
  const guidesTimeout = useRef(null);

  /* ── Auth state (real Supabase Auth session) ── */
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Resolve any existing session on first paint.
    getSession().then((session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    });
    // Keep in sync: sign-in, token refresh, sign-out (also from the dashboard).
    const unsubscribe = onAuthStateChange((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const isAuthenticated = authReady && user != null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
    setUser(null);
    navigate("/");
  };

  /* ── Smart floating state ── */
  const [floatingActive, setFloatingActive] = useState(false); // scrolled past threshold
  const [navShown, setNavShown] = useState(true);              // floating navbar visible
  const scrollData = useRef({ lastY: 0, ticking: false });
  const hideTimer = useRef(null);

  /* prefers-reduced-motion */
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Timer helpers ── */
  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    if (prefersReduced) return;
    clearHideTimer();
    hideTimer.current = setTimeout(() => {
      setNavShown(false);
      hideTimer.current = null;
    }, AUTO_HIDE_MS);
  }, [clearHideTimer, prefersReduced]);

  const showNav = useCallback(() => {
    clearHideTimer();
    setNavShown(true);
    startHideTimer();
  }, [clearHideTimer, startHideTimer]);

  const hideNav = useCallback(() => {
    clearHideTimer();
    setNavShown(false);
  }, [clearHideTimer]);

  /* ── Scroll direction detection ── */
  useEffect(() => {
    const handleScroll = () => {
      if (scrollData.current.ticking) return;
      scrollData.current.ticking = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - scrollData.current.lastY;
        scrollData.current.lastY = y;
        scrollData.current.ticking = false;

        /* At the top — always show static navbar */
        if (y <= SCROLL_THRESHOLD) {
          setFloatingActive(false);
          clearHideTimer();
          setNavShown(true);
          return;
        }

        /* Floating mode active */
        setFloatingActive(true);

        /* Ignore tiny scroll fluctuations */
        if (Math.abs(diff) < SCROLL_IGNORE) return;

        if (diff > 0) {
          hideNav();   // scrolling down → hide immediately
        } else {
          showNav();   // scrolling up → reveal
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showNav, hideNav, clearHideTimer]);

  /* ── Hover-to-reveal at top edge ── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientY < TOP_HOVER_ZONE && floatingActive) {
        showNav();
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [floatingActive, showNav]);

  /* ── Pointer enter/leave on navbar itself ── */
  const handleNavMouseEnter = useCallback(() => {
    clearHideTimer();
    if (floatingActive) setNavShown(true);
  }, [clearHideTimer, floatingActive]);

  const handleNavMouseLeave = useCallback(() => {
    if (floatingActive) startHideTimer();
  }, [floatingActive, startHideTimer]);

  /* Cleanup timer on unmount */
  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  /* ── Guides dropdown handlers ── */
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
    if (!isHomepage) {
      e.preventDefault();
      navigateToSection(sectionId);
    }
  };

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
    { name: "Community", href: "/community", path: true },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  /* ── Derived animation values ── */
  const animDuration = prefersReduced ? 0 : ANIM_DURATION;
  const isHidden = floatingActive && !navShown;

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

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={cn("fixed inset-x-0 top-4 z-50 w-full", isHomepage && "rdc-topbar")}
        onMouseEnter={handleNavMouseEnter}
        onMouseLeave={handleNavMouseLeave}
        aria-hidden={isHidden}
      >
        {/* ── Smart floating wrapper — animates show/hide ── */}
        <motion.div
          initial={false}
          animate={{
            scaleX: isHidden ? SQUEEZE_SCALE : 1,
            y: isHidden ? -120 : 0,
            opacity: isHidden ? 0 : 1,
          }}
          transition={{
            scaleX: isHidden
              ? { duration: prefersReduced ? 0 : 1, ease: [0.25, 0.46, 0.45, 0.94] }
              : { duration: prefersReduced ? 0 : 1, delay: prefersReduced ? 0 : 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
            y: isHidden
              ? { duration: animDuration, delay: prefersReduced ? 0 : 1, ease: [0.25, 0.46, 0.45, 0.94] }
              : { duration: animDuration, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: isHidden
              ? { duration: animDuration, delay: prefersReduced ? 0 : 1, ease: [0.25, 0.46, 0.45, 0.94] }
              : { duration: animDuration, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] },
          }}
          style={{
            transformOrigin: "center",
            pointerEvents: isHidden ? "none" : "auto",
          }}
          className="w-full"
        >
          {/* ════════ DESKTOP (≥lg) ════════ */}
          <motion.div
            animate={{
              backdropFilter: floatingActive ? "blur(10px)" : "none",
              boxShadow: floatingActive
                ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
                : "none",
              width: floatingActive ? "60%" : "100%",
              y: floatingActive ? 20 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 50 }}
            style={{ minWidth: "820px" }}
            className={cn(
              "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full px-4 py-2 lg:flex",
              floatingActive
                ? "border border-gray-200 bg-white/80"
                : "border border-transparent bg-transparent"
            )}
          >
            {/* Left — RDC logo + branding */}
            <a
              href={isHomepage ? "#home" : "/"}
              onClick={(e) => handleNavClick(e, "home")}
              className="flex shrink-0 items-center gap-2.5 transition-transform hover:scale-105"
              aria-label="Razia Driving Center — Home"
            >
              <img src={rdcLogo} alt="Razia Driving Center" width="40" height="40" />
              <span className="text-[15px] font-bold tracking-tight text-gray-900">Razia Driving Center</span>
            </a>

            {/* Center — text links */}
            <div className="hidden items-center gap-7 lg:flex">
              {navLinks.map((link) => {
                if (link.path) {
                  return (
                    <button
                      key={link.name}
                      onClick={() => navigate(link.href)}
                      className={cn(
                        "relative text-sm font-medium transition-colors duration-200",
                        route === link.href || route === link.href + "/"
                          ? "text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {link.name}
                    </button>
                  );
                }
                return (
                  <a
                    key={link.name}
                    href={isHomepage ? link.href : "/" + link.href}
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
                );
              })}

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

            {/* Right — Signup/Dashboard + Book Now + mobile toggle */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/dashboard/")}
                  className="hidden items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-gray-700 lg:flex"
                  aria-label="Go to your dashboard"
                >
                  <User size={14} />
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setSignupOpen(true)}
                  className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-50 lg:flex"
                  aria-label="Sign in"
                >
                  <img src={googleLogo} alt="" width="16" height="16" className="h-4 w-4" />
                  Sign in
                </button>
              )}
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
              backdropFilter: floatingActive ? "blur(10px)" : "none",
              boxShadow: floatingActive
                ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
                : "none",
              width: floatingActive ? "92%" : "100%",
              paddingRight: floatingActive ? "12px" : "0px",
              paddingLeft: floatingActive ? "12px" : "0px",
              borderRadius: floatingActive ? "24px" : "9999px",
              y: floatingActive ? 10 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 50 }}
            className={cn(
              "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-row items-center justify-between rounded-full px-4 py-2 lg:hidden",
              floatingActive
                ? "border border-gray-200 bg-white/80"
                : "border border-gray-200 bg-white"
            )}
          >
            {/* Left — RDC logo + branding */}
            <a
              href={isHomepage ? "#home" : "/"}
              onClick={(e) => handleNavClick(e, "home")}
              className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105"
              aria-label="Razia Driving Center — Home"
            >
              <img src={rdcLogo} alt="Razia Driving Center" width="40" height="40" />
              <span className="text-[14px] font-bold tracking-tight text-gray-900">Razia Driving Center</span>
            </a>

            {/* Right — Book Now + toggle (Sign in/Dashboard lives in the hero on mobile) */}
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
        </motion.div>
      </motion.nav>

      {/* ── Sign-in modal (real Google OAuth) ── */}
      <CustomerSignup
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
      />

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
                {navLinks.map((link) => {
                  if (link.path) {
                    return (
                      <button
                        key={link.name}
                        onClick={() => {
                          navigate(link.href);
                          setMenuOpen(false);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        {link.name}
                      </button>
                    );
                  }
                  return (
                    <a
                      key={link.name}
                      href={isHomepage ? link.href : "/" + link.href}
                      onClick={(e) => {
                        handleNavClick(e, link.href.slice(1));
                        setMenuOpen(false);
                      }}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-50"
                    >
                      {link.name}
                    </a>
                  );
                })}

                {/* Dashboard — only when signed in */}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      navigate("/dashboard/");
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-base font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    <User size={16} className="text-[#FF6201]" />
                    Dashboard
                  </button>
                )}

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

              {/* Mobile Sign out — only when signed in */}
              {isAuthenticated && (
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              )}

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
