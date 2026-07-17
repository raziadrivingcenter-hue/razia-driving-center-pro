import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";



function Navbar({ onBookNow }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
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
 useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 40);
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
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
      {/* Navbar */}
      <motion.nav
      initial={{
  y: -80,
  opacity: 0,
}}

animate={{
  y: 0,
  opacity: 1,
}}

transition={{
  duration: 0.8,
}}
  className={`
fixed
top-0
left-0
right-0
z-50
transition-all
duration-500
${
  scrolled
    ? "bg-white/80 backdrop-blur-2xl shadow-xl border-b border-white/30"
    : "bg-transparent border-b border-transparent"
}
`}
>

        <div
  className={`
    mx-auto
    flex
    max-w-7xl
    items-center
    justify-between
    px-6
    transition-all
    duration-500
    ${
      scrolled
        ? "py-3"
        : "py-5"
    }
  `}
>

          {/* Logo */}
          <a href="#home">
            <img
              src={logo}
              alt="Razia Driving Center"
              className={`
  w-auto
  transition-all
  duration-500
  hover:scale-105 hover:rotate-1
  ${
    scrolled
      ? "h-8"
      : "h-10"
  }
`}
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#home"
              className="
relative
font-medium
text-gray-700
transition-all
duration-300
hover:text-[#FF6201]
after:absolute
after:left-0
after:-bottom-1
after:h-[2px]
after:w-0
after:bg-[#FF6201]
after:transition-all
after:duration-300
hover:after:w-full
"
            >
              Home
            </a>

            <a
              href="#courses"
              className="
relative
font-medium
text-gray-700
transition-all
duration-300
hover:text-[#FF6201]
after:absolute
after:left-0
after:-bottom-1
after:h-[2px]
after:w-0
after:bg-[#FF6201]
after:transition-all
after:duration-300
hover:after:w-full
"
            >
              Courses
            </a>

            <a
              href="#reviews"
              className="
relative
font-medium
text-gray-700
transition-all
duration-300
hover:text-[#FF6201]
after:absolute
after:left-0
after:-bottom-1
after:h-[2px]
after:w-0
after:bg-[#FF6201]
after:transition-all
after:duration-300
hover:after:w-full
"
            >
              Reviews
            </a>

            <a
              href="#about"
              className="
relative
font-medium
text-gray-700
transition-all
duration-300
hover:text-[#FF6201]
after:absolute
after:left-0
after:-bottom-1
after:h-[2px]
after:w-0
after:bg-[#FF6201]
after:transition-all
after:duration-300
hover:after:w-full
"
            >
              About
            </a>

            <a
              href="#contact"
              className="
relative
font-medium
text-gray-700
transition-all
duration-300
hover:text-[#FF6201]
after:absolute
after:left-0
after:-bottom-1
after:h-[2px]
after:w-0
after:bg-[#FF6201]
after:transition-all
after:duration-300
hover:after:w-full
"
            >
              Contact
            </a>

          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">

            {/* Desktop Button */}
            <button
  onClick={onBookNow}
  className="
    hidden
    md:inline-flex
    items-center
    justify-center
    rounded-2xl
    bg-gradient-to-r
    from-[#FF3131]
    to-[#FF6201]
    px-8
    py-4
    font-bold
    text-white
    shadow-lg
    transition-all
    duration-300
    hover:-translate-y-1
    hover:scale-105
    hover:shadow-2xl
  "
>
  Book Now
</button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-xl p-2 transition hover:bg-gray-100 md:hidden"
            >
              <Menu size={30} />
            </button>

          </div>

        </div>

      </motion.nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden">

          <div className="absolute right-0 h-full w-72 bg-white p-8 shadow-2xl transition-all duration-300 ease-out">

            {/* Close Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="mb-8 text-3xl font-bold transition hover:text-[#FF6201]"
            >
              ✕
            </button>

            {/* Menu Links */}
            <div className="flex flex-col gap-3 text-lg font-semibold">

              <a
                href="#home"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-2 hover:bg-orange-100 hover:text-[#FF6201]"
              >
                Home
              </a>

              <a
                href="#courses"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-2 hover:bg-orange-100 hover:text-[#FF6201]"
              >
                Courses
              </a>

              <a
                href="#reviews"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-2 hover:bg-orange-100 hover:text-[#FF6201]"
              >
                Reviews
              </a>

              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-2 hover:bg-orange-100 hover:text-[#FF6201]"
              >
                About
              </a>

              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-2 hover:bg-orange-100 hover:text-[#FF6201]"
              >
                Contact
              </a>

              {/* Mobile Book Button */}
              <button
  onClick={onBookNow}
  className="
  hidden
  rounded-xl
  bg-gradient-to-r
  from-[#FF3131]
  to-[#FF6201]
  px-6
  py-3
  font-semibold
  text-white
  shadow-lg
  transition-all
  duration-300
  hover:-translate-y-1
  hover:scale-105
  hover:shadow-2xl
  md:block
  "
>
  Book Now
</button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default Navbar;