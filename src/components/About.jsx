import {
  ShieldCheck,
  Award,
  Users,
  Car,
} from "lucide-react";

function About() {
  return (
    <section
      id="about"
      data-aos="fade-left"
      className="bg-white py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-20 px-6 md:grid-cols-2">

        {/* Left Side */}

        <div>

          <span className="rounded-full bg-orange-100 px-4 py-2 font-semibold text-[#FF6201]">
            About Razia Driving Center
          </span>

          <h2 className="mt-6 text-5xl font-black leading-tight">
            Learn Driving with
            <span className="text-[#FF6201]">
              {" "}Confidence
            </span>
          </h2>

          <p className="mt-8 text-lg leading-8 text-gray-600">
            Razia Driving Center has proudly trained thousands of students
            throughout Lahore. Our experienced female instructors provide
            one-to-one practical driving lessons on real roads, helping
            beginners become confident, safe and responsible drivers.
          </p>

          <div className="mt-12 space-y-6">

            <div className="flex items-start gap-5">

              <div className="rounded-2xl bg-orange-100 p-4">
                <ShieldCheck
                  className="text-[#FF6201]"
                  size={32}
                />
              </div>

              <div>

                <h3 className="text-xl font-bold">
                  Safe Learning
                </h3>

                <p className="mt-2 text-gray-600">
                  Professional one-to-one driving lessons with complete
                  safety and confidence.
                </p>

              </div>

            </div>

            <div className="flex items-start gap-5">

              <div className="rounded-2xl bg-orange-100 p-4">
                <Award
                  className="text-[#FF6201]"
                  size={32}
                />
              </div>

              <div>

                <h3 className="text-xl font-bold">
                  20+ Years Experience
                </h3>

                <p className="mt-2 text-gray-600">
                  Highly experienced female instructors trusted by
                  thousands of students.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Right Side */}

        <div className="grid gap-8 sm:grid-cols-2">

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <Users
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-5xl font-black">
              5000+
            </h3>

            <p className="mt-2 text-gray-600">
              Students Trained
            </p>

          </div>

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <Award
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-5xl font-black">
              20+
            </h3>

            <p className="mt-2 text-gray-600">
              Years Experience
            </p>

          </div>

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <Car
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-5xl font-black">
              10+
            </h3>

            <p className="mt-2 text-gray-600">
              Driving Courses
            </p>

          </div>

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <ShieldCheck
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-5xl font-black">
              100%
            </h3>

            <p className="mt-2 text-gray-600">
              Practical Training
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}

export default About;