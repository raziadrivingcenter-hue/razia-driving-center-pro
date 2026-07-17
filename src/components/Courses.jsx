import CustomCourseCard from "./CustomCourseCard";
import SectionTitle from "./UI/SectionTitle";
import GlowCard from "./GlowCard";
import CourseCard from "./CourseCard";

const courses = [
  {
    title: "Economy Driving Course",
    oldPrice: "Rs. 16,000",
    price: "Rs. 14,500",
    duration: "10 Days Training",
    features: [
      "30 Minutes Daily",
      "Female Instructor",
      "Real Traffic Practice",
      "Beginner Friendly",
    ],
    popular: false,
  },
  {
    title: "Pro Driver Course",
    oldPrice: "Rs. 28,000",
    price: "Rs. 26,500",
    duration: "21 Days Training",
    features: [
      "Advanced Skills",
      "Parking Practice",
      "Heavy Traffic",
      "Confidence Building",
    ],
    popular: true,
  },
  {
    title: "Own Vehicle Training",
    oldPrice: "Rs. 15,000",
    price: "Rs. 13,989",
    duration: "10 Days Training",
    features: [
      "Learn in Your Vehicle",
      "Road Confidence",
      "Expert Guidance",
      "Personal Practice",
    ],
    popular: false,
  },
];

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

            <GlowCard key={course.title}>

              <CourseCard
                title={course.title}
                oldPrice={course.oldPrice}
                price={course.price}
                duration={course.duration}
                features={course.features}
                popular={course.popular}
                onBook={onCustomBooking}
              />

            </GlowCard>

          ))}

        </div>

        {/* Custom Course Builder */}

        <div className="mx-auto mt-16 max-w-3xl">

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