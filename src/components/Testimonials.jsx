const reviews = [
  {
    name: "Ayesha",
    role: "Student",
    review:
      "Madam Razia explained everything patiently. Now I confidently drive in Lahore traffic.",
  },
  {
    name: "Ahmed",
    role: "Student",
    review:
      "Very professional training. I passed my driving test confidently.",
  },
  {
    name: "Fatima",
    role: "Student",
    review:
      "Best female driving instructor. Highly recommended for beginners.",
  },
];

function Testimonials() {
  return (
    <section
      id="reviews"
      data-aos="fade-right"
      className="bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        <h2 className="text-center text-5xl font-black">
          Loved by Our Students
        </h2>

        <p className="mt-4 text-center text-lg text-gray-500">
          Thousands of successful drivers trust Razia Driving Center.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">

          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
            >

              <div className="text-2xl">
                ⭐⭐⭐⭐⭐
              </div>

              <p className="mt-6 leading-8 text-gray-600">
                "{review.review}"
              </p>

              <div className="mt-8 flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3131] to-[#FF6201] text-xl font-bold text-white">
                  {review.name.charAt(0)}
                </div>

                <div>

                  <h3 className="font-bold">
                    {review.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {review.role}
                  </p>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Testimonials;