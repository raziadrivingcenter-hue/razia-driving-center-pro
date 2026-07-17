import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is the course fee?",
    answer:
      "Our Economy Driving Course starts from Rs. 14,500. We also offer Pro Driver and Own Vehicle training packages.",
  },
  {
    question: "Do you provide female driving instructors?",
    answer:
      "Yes. We specialize in professional one-to-one driving lessons with experienced female instructors.",
  },
  {
    question: "Do you provide Pick & Drop?",
    answer:
      "Yes. Pick & Drop is available in selected areas of Lahore. Contact us to confirm your location.",
  },
  {
    question: "Can complete beginners join?",
    answer:
      "Absolutely! Most of our students have never driven before. We teach from the very basics.",
  },
  {
    question: "How many days is the course?",
    answer:
      "Our Economy Course is 10 days, while the Pro Driver Course provides extended practical training.",
  },
  {
    question: "Which areas do you cover?",
    answer:
      "We provide driving lessons in Gulberg and many surrounding areas of Lahore. Contact us for availability.",
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