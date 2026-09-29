import { useState } from "react";
import { ChevronDown } from "lucide-react";

// FAQPage structured data — mirrors the visible Q&A below so search engines
// can surface these as rich results and AI engines can cite them directly.
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which driving school is in Gulberg 2, Lahore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center is a driving school based in Gulberg 2, Lahore. It offers one-to-one driving lessons with an experienced female instructor.",
      },
    },
    {
      "@type": "Question",
      name: "Does Razia Driving Center have a female instructor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All driving lessons at Razia Driving Center are taught by an experienced female instructor, Madam Razia.",
      },
    },
    {
      "@type": "Question",
      name: "Is the training one-to-one?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every lesson is a private one-to-one session. There are no shared lessons.",
      },
    },
    {
      "@type": "Question",
      name: "How much do driving lessons cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center offers three structured courses: the Basic Plan at Rs. 9,999 (7 days), the Economy / PLUS Plan at Rs. 14,500 (10 days), and the Pro / PRO+ Plan at Rs. 21,750 (15 days). A custom course builder is also available on the website.",
      },
    },
    {
      "@type": "Question",
      name: "How long are the courses?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Basic Plan runs for 7 days, the Economy (PLUS) Plan for 10 days, and the Pro (PRO+) Plan for 15 days. Each daily session is 30 minutes of practical driving.",
      },
    },
    {
      "@type": "Question",
      name: "Can complete beginners join?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Most students at Razia Driving Center are complete beginners. Training starts from the very basics and builds up to confident, independent driving.",
      },
    },
    {
      "@type": "Question",
      name: "Does training include real Lahore traffic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Practical training takes place on real Lahore roads in actual traffic conditions, so learners build confidence for everyday driving.",
      },
    },
    {
      "@type": "Question",
      name: "Does training include parking and reversing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The practical training covers parking, reversing, U-turns, clutch control and traffic-rule education.",
      },
    },
    {
      "@type": "Question",
      name: "Is pick & drop available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pick & drop is available in selected areas of Lahore. Contact Razia Driving Center to confirm availability for your location.",
      },
    },
    {
      "@type": "Question",
      name: "What areas does Razia Driving Center serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center is based in Gulberg 2 and serves Gulberg III, Lahore Cantt and surrounding areas across Lahore.",
      },
    },
    {
      "@type": "Question",
      name: "What are the training hours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Driving training runs from 8:00 AM to 8:00 PM, Monday to Sunday.",
      },
    },
    {
      "@type": "Question",
      name: "What are the consultation hours?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Consultation and customer support is available from 7:00 AM to 12:00 AM (midnight), Monday to Sunday.",
      },
    },
    {
      "@type": "Question",
      name: "How is Razia Driving Center rated on Google?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center is rated 5.0 out of 5 on Google, based on 133 verified Google reviews.",
      },
    },
    {
      "@type": "Question",
      name: "When was Razia Driving Center established?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Razia Driving Center was established in December 2016. It has taught thousands of students across Lahore since then.",
      },
    },
  ],
};

const faqs = [
  {
    question: "Which driving school is in Gulberg 2, Lahore?",
    answer:
      "Razia Driving Center is a driving school based in Gulberg 2, Lahore. It offers one-to-one driving lessons with an experienced female instructor.",
  },
  {
    question: "Does Razia Driving Center have a female instructor?",
    answer:
      "Yes. All driving lessons at Razia Driving Center are taught by an experienced female instructor, Madam Razia.",
  },
  {
    question: "Is the training one-to-one?",
    answer:
      "Yes. Every lesson is a private one-to-one session. There are no shared lessons.",
  },
  {
    question: "How much do driving lessons cost?",
    answer:
      "Razia Driving Center offers three structured courses: the Basic Plan at Rs. 9,999 (7 days), the Economy / PLUS Plan at Rs. 14,500 (10 days), and the Pro / PRO+ Plan at Rs. 21,750 (15 days). A custom course builder is also available on the website.",
  },
  {
    question: "How long are the courses?",
    answer:
      "The Basic Plan runs for 7 days, the Economy (PLUS) Plan for 10 days, and the Pro (PRO+) Plan for 15 days. Each daily session is 30 minutes of practical driving.",
  },
  {
    question: "Can complete beginners join?",
    answer:
      "Yes. Most students at Razia Driving Center are complete beginners. Training starts from the very basics and builds up to confident, independent driving.",
  },
  {
    question: "Does training include real Lahore traffic?",
    answer:
      "Yes. Practical training takes place on real Lahore roads in actual traffic conditions, so learners build confidence for everyday driving.",
  },
  {
    question: "Does training include parking and reversing?",
    answer:
      "Yes. The practical training covers parking, reversing, U-turns, clutch control and traffic-rule education.",
  },
  {
    question: "Is pick & drop available?",
    answer:
      "Yes. Pick & drop is available in selected areas of Lahore. Contact Razia Driving Center to confirm availability for your location.",
  },
  {
    question: "What areas does Razia Driving Center serve?",
    answer:
      "Razia Driving Center is based in Gulberg 2 and serves Gulberg III, Lahore Cantt and surrounding areas across Lahore.",
  },
  {
    question: "What are the training hours?",
    answer:
      "Driving training runs from 8:00 AM to 8:00 PM, Monday to Sunday.",
  },
  {
    question: "What are the consultation hours?",
    answer:
      "Consultation and customer support is available from 7:00 AM to 12:00 AM (midnight), Monday to Sunday.",
  },
  {
    question: "How is Razia Driving Center rated on Google?",
    answer:
      "Razia Driving Center is rated 5.0 out of 5 on Google, based on 133 verified Google reviews.",
  },
  {
    question: "When was Razia Driving Center established?",
    answer:
      "Razia Driving Center was established in December 2016. It has taught thousands of students across Lahore since then.",
  },
];

function FAQ() {
  const [active, setActive] = useState(null);

  const toggleFAQ = (index) => {
    setActive(active === index ? null : index);
  };

  return (
    <section
      id="faq"
      data-aos="fade-up"
      className="bg-gray-50 py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <div className="mx-auto max-w-4xl px-6">

        <h2 className="text-center text-5xl font-black">
          Frequently Asked Questions
        </h2>

        <p className="mt-4 text-center text-lg text-gray-500">
          Everything you need to know before joining Razia Driving Center.
        </p>

        <div className="mt-16 space-y-5">

          {faqs.map((faq, index) => (

            <div
              key={index}
              className="overflow-hidden rounded-2xl bg-white shadow-lg"
            >

              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-6 text-left"
              >

                <span className="text-lg font-bold">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    active === index ? "rotate-180" : ""
                  }`}
                />

              </button>

              <div
                className={`grid transition-all duration-300 ${
                  active === index
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >

                <div className="overflow-hidden">

                  <p className="px-6 pb-6 leading-8 text-gray-600">
                    {faq.answer}
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

export default FAQ;