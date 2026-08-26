import CustomCourseCard from "./CustomCourseCard";
import SectionTitle from "./UI/SectionTitle";
import GlowCard from "./GlowCard";
import CourseCard from "./CourseCard";
import {
  CalendarCheck,
  CalendarDays,
  UserRound,
  Route,
  ParkingSquare,
  ShieldCheck,
  Gauge,
  Sparkles,
  Gem,
} from "lucide-react";

const courses = [
  {
    name: "Economy Driving Course",
    title: "PLUS Plan",
    oldPrice: "Rs. 16,000",
    price: "Rs. 14,500",
    duration: "10 Days Training",
    features: [
      { icon: CalendarCheck, text: "10/10 Days Practical Training" },
      { icon: UserRound, text: "1-on-1 Private Driving Lessons" },
      { icon: Route, text: "Main Road & Real Traffic Training" },
      { icon: ParkingSquare, text: "Parking & Reversing Skills" },
      { icon: ShieldCheck, text: "Dual-Braking Safety System" },
      { icon: Gauge, text: "Clutch Control & Complete Driving Skills" },
    ],
    badge: { icon: Sparkles, text: "Most Selling / Public Favorite" },
    titleIcon: null,
  },
  {
    name: "Pro Driver Course",
    title: "Pro+ Plan",
    oldPrice: "Rs. 28,000",
    price: "Rs. 26,500",
    duration: "21 Days Training",
    features: [
      { icon: CalendarDays, text: "21 Days Practical Training" },
      { icon: UserRound, text: "1-on-1 Advanced Driving Lessons" },
      { icon: Route, text: "Heavy Traffic & Main Road Training" },
      { icon: ParkingSquare, text: "Advanced Parking & Reversing" },
      { icon: ShieldCheck, text: "Dual-Braking Safety System" },
      { icon: Gauge, text: "Clutch Control & Complete Driving Skills" },
    ],
    badge: null,
    titleIcon: Gem,
  },
  {
    name: "Own Vehicle Training",
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
    badge: null,
    titleIcon: null,
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