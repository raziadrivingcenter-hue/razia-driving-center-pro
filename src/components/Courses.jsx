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
      className="bg-gray-50 py-24"
    >
      <div className="mx-auto max-w-7xl px-6">

        <SectionTitle
          badge="Professional Courses"
          title="Choose Your Driving Course"
          subtitle="Professional one-to-one driving lessons designed to help you become a safe and confident driver on Lahore's roads."
        />

        {/* Standard Courses */}

        <div className="mt-16 grid gap-10 md:grid-cols-3">

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

        <div className="mx-auto mt-16 max-w-5xl">

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