import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import gallery1 from "../assets/gallery/gallery1.png";
import gallery2 from "../assets/gallery/gallery2.png";
import gallery3 from "../assets/gallery/gallery3.png";

const images = [
  gallery1,
  gallery2,
  gallery3,
];

function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <section
        id="gallery"
        data-aos="fade-up"
        className="bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">

            <span className="rounded-full bg-orange-100 px-4 py-2 font-semibold text-[#FF6201]">
              Student Gallery
            </span>

            <h2 className="mt-6 text-5xl font-black">
              Behind The Wheel
            </h2>

            <p className="mt-4 text-lg text-gray-500">
              Take a look at professional driving lessons and practical training
              at Razia Driving Center.
            </p>

          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {images.map((image, index) => (

              <motion.div
                key={index}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
                whileHover={{ y: -8 }}
                className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-xl"
                onClick={() => setSelectedImage(image)}
              >

                <img
                  src={image}
                  alt={`Driving Lesson ${index + 1}`}
                  className="h-80 w-full object-cover transition duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-500 group-hover:bg-black/45">

                  <div className="translate-y-8 rounded-xl bg-white px-6 py-3 font-bold opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">

                    📸 View Image

                  </div>

                </div>

              </motion.div>

            ))}

          </div>

        </div>
      </section>

      {/* LIGHTBOX */}

      <AnimatePresence>

        {selectedImage && (

          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >

            <motion.img
              src={selectedImage}
              alt="Gallery Preview"
              initial={{
                scale: 0.7,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.7,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
              }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            />

            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-8 top-8 flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl font-bold shadow-xl transition hover:scale-110"
            >
              ✕
            </button>

          </motion.div>

        )}

      </AnimatePresence>
    </>
  );
}

export default Gallery;