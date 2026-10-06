// Shared content for the /driving-school-gulberg-lahore/ service page.
// Single source of truth — imported by both the React ServicePage component
// and the build-time static HTML generator (scripts/build-service-page.js).

export const SERVICE_META = {
  title: "Driving School Gulberg Lahore | Razia Driving Center",
  description:
    "Learn driving in Gulberg 2, Lahore with Razia Driving Center. One-to-one driving lessons, beginner training, ladies driving lessons and practical Lahore traffic training.",
  canonical: "https://raziadrivingcenter.com/driving-school-gulberg-lahore/",
};

export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://raziadrivingcenter.com/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Driving School Gulberg Lahore",
      item: "https://raziadrivingcenter.com/driving-school-gulberg-lahore/",
    },
  ],
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is Razia Driving Center located in Gulberg?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center is located at 28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer driving lessons for beginners?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Razia Driving Center specialises in beginner-friendly training. Lessons start from basic vehicle control and progress to confident independent driving.",
      },
    },
    {
      "@type": "Question",
      name: "Are female driving lessons available in Gulberg?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All driving lessons at Razia Driving Center are taught by an experienced female instructor, with ladies-focused training available.",
      },
    },
    {
      "@type": "Question",
      name: "Do you provide practical driving training in Lahore traffic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Practical training takes place on real Lahore roads in actual traffic conditions so learners build confidence for everyday driving.",
      },
    },
    {
      "@type": "Question",
      name: "How can I contact Razia Driving Center?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can call or WhatsApp Razia Driving Center at +92 309 4461407, or visit the contact page on the website.",
      },
    },
  ],
};

export const skills = [
  "Starting, stopping and basic vehicle control",
  "Steering control at different speeds",
  "Gear and clutch control",
  "Braking and smooth acceleration",
  "Lane discipline and road positioning",
  "Turning at junctions and intersections",
  "U-turns on busy roads",
  "Reverse driving in tight spaces",
  "Parallel and standard parking",
  "Driving in real Lahore traffic",
  "Road awareness and hazard perception",
  "Building practical driving confidence",
];

// Condensed content for the crawlable static HTML fallback.
// This is a condensed version for SEO crawlers — the full interactive
// experience is rendered by the React ServicePage component.
export const staticContent = {
  heading: "Driving School in Gulberg Lahore",
  intro:
    "Razia Driving Center provides practical one-to-one driving lessons from its Gulberg 2 location. Whether you are a complete beginner or want to build confidence on Lahore roads, our structured training helps you become a safe and independent driver.",
  features: [
    "One-to-one private driving lessons",
    "Beginner-friendly instruction from scratch",
    "Ladies-focused training with a female instructor",
    "Practical training on real Lahore roads",
    "Manual car instruction",
    "5,118+ students trained since 2016",
    "5.0 Google rating from 133 reviews",
  ],
  courses: [
    { name: "Basic Plan", detail: "7 days, Rs. 9,999" },
    { name: "PLUS Plan", detail: "10 days, Rs. 14,500" },
    { name: "PRO+ Plan", detail: "15 days, Rs. 21,750" },
  ],
  location: {
    address: "28/A, S Block, Gulberg 2, Lahore, 54660, Pakistan",
    phone: "+92 309 4461407",
    hours: "8:00 AM – 8:00 PM, Monday – Sunday",
  },
};
