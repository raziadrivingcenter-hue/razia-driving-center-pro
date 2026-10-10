import CustomCourseCard from "./CustomCourseCard";
import SectionTitle from "./UI/SectionTitle";
import GlowCard from "./GlowCard";
import CourseCard from "./CourseCard";
import { courses } from "../data/courses";

function Courses({ onCustomBooking }) {
  return (
    <section
      id="courses"
      data-aos="fade-up"
      className="bg-gray-50 py-8 md:py-10"
    >
      <div className="mx-auto max-w-6xl px-6">

        <SectionTitle
          badge="Professional Courses"
          title="Choose Your Driving Course"
          subtitle="One-to-one driving lessons designed to help you become a safe and confident driver on Lahore's roads."
        />

        {/* Standard Courses */}

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">

          {courses.map((course) => (

            <GlowCard key={course.name}>

              <CourseCard
                name={course.name}
                title={course.title}
                oldPrice={course.oldPrice}
                price={course.price}
                duration={course.duration}
                features={course.features}
                badge={course.badge}
                titleIcon={course.titleIcon}
                onBook={onCustomBooking}
              />

            </GlowCard>

          ))}

        </div>

        {/* Custom Course Builder */}

        <div className="mx-auto mt-6 max-w-6xl">

          <GlowCard>

            <CustomCourseCard
              onBook={onCustomBooking}
            />

          </GlowCard>

        </div>

      </div>
    </section>
  );
}

export default Courses;
