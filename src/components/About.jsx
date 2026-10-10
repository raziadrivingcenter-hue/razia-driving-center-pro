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
      className="bg-white py-8 md:py-10"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 md:grid-cols-2 md:gap-10">

        {/* Left Side */}

        <div>

          <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-[#FF6201]">
            About Razia Driving Center
          </span>

          <h2 className="mt-3 text-2xl font-black leading-[1.2] md:text-3xl">
            Learn Driving with
            <span className="text-[#FF6201]">
              {" "}Confidence
            </span>
          </h2>

          <p className="mt-3 text-sm leading-[1.45] text-gray-600">
            Razia Driving Center has proudly trained thousands of students
            across Lahore since December 2016. Our experienced{" "}
            <a href="#instructor" className="font-medium text-[#FF6201] underline">female instructor</a>
            {" "}provides one-to-one practical driving lessons on
            real Lahore roads, helping beginners become confident, safe and
            responsible drivers.
          </p>

          <div className="mt-5 space-y-3">

            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-orange-100 p-2.5">
                <ShieldCheck
                  className="text-[#FF6201]"
                  size={20}
                />
              </div>

              <div>

                <h3 className="text-sm font-bold">
                  Safe Learning
                </h3>

                <p className="mt-0.5 text-xs leading-snug text-gray-600">
                  Professional one-to-one driving lessons with complete
                  safety and confidence.
                </p>

              </div>

            </div>

            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-orange-100 p-2.5">
                <Award
                  className="text-[#FF6201]"
                  size={20}
                />
              </div>

              <div>

                <h3 className="text-sm font-bold">
                  Est. 2016
                </h3>

                <p className="mt-0.5 text-xs leading-snug text-gray-600">
                  Trusted by thousands of students across Lahore for nearly a decade.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Right Side */}

        <div className="grid gap-3 sm:grid-cols-2">

          <div className="rounded-xl bg-gray-50 p-4 text-center shadow-md">

            <Users
              size={28}
              className="mx-auto text-[#FF6201]"
            />

            <h3 className="mt-2 text-xl font-black">
              5,218
            </h3>

            <p className="mt-0.5 text-xs text-gray-600">
              Students Trained
            </p>

          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-center shadow-md">

            <Award
              size={28}
              className="mx-auto text-[#FF6201]"
            />

            <h3 className="mt-2 text-xl font-black">
              5.0 ★
            </h3>

            <p className="mt-0.5 text-xs text-gray-600">
              133 Google Reviews
            </p>

          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-center shadow-md">

            <Car
              size={28}
              className="mx-auto text-[#FF6201]"
            />

            <h3 className="mt-2 text-xl font-black">
              Est. 2016
            </h3>

            <p className="mt-0.5 text-xs text-gray-600">
              Gulberg 2, Lahore
            </p>

          </div>

          <div className="rounded-xl bg-gray-50 p-4 text-center shadow-md">

            <ShieldCheck
              size={28}
              className="mx-auto text-[#FF6201]"
            />

            <h3 className="mt-2 text-xl font-black">
              1-on-1
            </h3>

            <p className="mt-0.5 text-xs text-gray-600">
              Female Instructor
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}

export default About;
