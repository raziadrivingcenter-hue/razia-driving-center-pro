import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const enrollments = [
  {
    name: "Ayesha",
    area: "Gulberg",
    course: "Economy Driving Course",
    time: "1 hour ago",
  },
  {
    name: "Ali",
    area: "DHA",
    course: "Pro Driver Course",
    time: "5 minutes ago",
  },
  {
    name: "Fatima",
    area: "Johar Town",
    course: "Own Vehicle Training",
    time: "8 minutes ago",
  },
  {
    name: "Ahmed",
    area: "Model Town",
    course: "Economy Driving Course",
    time: "12 minutes ago",
  },
  {
    name: "Zainab",
    area: "Garden Town",
    course: "Pro Driver Course",
    time: "18 minutes ago",
  },
];

function LiveEnrollment() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show immediately after page loads
    setVisible(true);

    const hideFirst = setTimeout(() => {
      setVisible(false);
    }, 4000);

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % enrollments.length);

      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 4000);

    }, 60000); // every 60 seconds

    return () => {
      clearTimeout(hideFirst);
      clearInterval(interval);
    };
  }, []);

  const student = enrollments[index];

  return (
    <div className="fixed bottom-24 left-6 z-[999]">

      <AnimatePresence>

        {visible && (

          <motion.div
            key={index}
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -40,
            }}
            transition={{
              duration: 0.45,
            }}
            className="
              w-56
              rounded-2xl
              border
              border-white/30
              bg-white/20
              backdrop-blur-xl
              p-4
              shadow-xl
            "
          >

            {/* Header */}

            <div className="mb-3 flex items-center gap-2">

              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-lg text-white">

                🎉

                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500"></span>

              </div>

              <div>

                <h3 className="text-xs font-bold text-gray-900">
                  New Admission
                </h3>

                <p className="text-[11px] text-gray-600">
                  {student.time}
                </p>

              </div>

            </div>

            {/* Student */}

            <h4 className="text-base font-bold text-gray-900">
              {student.name}
            </h4>

            <p className="mt-1 text-xs text-gray-600">
              📍 {student.area}
            </p>

            <div className="mt-3 rounded-xl bg-white/40 px-3 py-2">

              <p className="text-xs font-semibold text-[#FF6201]">
                {student.course}
              </p>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
}

export default LiveEnrollment;