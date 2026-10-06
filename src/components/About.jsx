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
            across Lahore since December 2016. Our experienced{" "}
            <a href="#instructor" className="text-[#FF6201] underline font-medium">female instructor</a>
            {" "}provides one-to-one practical driving lessons on
            real Lahore roads, helping beginners become confident, safe and
            responsible drivers.
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
                  Est. 2016
                </h3>

                <p className="mt-2 text-gray-600">
                  Trusted by thousands of students across Lahore for nearly a decade.
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
              5118
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
              5.0 ★
            </h3>

            <p className="mt-2 text-gray-600">
              133 Google Reviews
            </p>

          </div>

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <Car
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-5xl font-black">
              Est. 2016
            </h3>

            <p className="mt-2 text-gray-600">
              Gulberg 2, Lahore
            </p>

          </div>

          <div className="group rounded-3xl bg-gray-50 p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl">

            <ShieldCheck
              size={50}
              className="mx-auto text-[#FF6201] transition duration-300 group-hover:scale-125"
            />

            <h3 className="mt-6 text-4xl font-black">
              1-on-1
            </h3>

            <p className="mt-2 text-gray-600">
              Female Instructor
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}

export default About;