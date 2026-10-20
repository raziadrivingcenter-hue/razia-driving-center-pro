import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollProgress from "./ScrollProgress";

const TERMS_META = {
  title: "Terms of Service | Razia Driving Center",
  description:
    "Read the Terms of Service for Razia Driving Center in Lahore, Pakistan, covering driving lesson inquiries, bookings, fees, website use, and service conditions.",
  canonical: "https://raziadrivingcenter.com/terms/",
};

function Section({ title, children }) {
  return (
    <section className="mb-8 md:mb-10">
      <h2 className="mb-3 text-xl font-bold text-gray-900 md:text-2xl">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed text-gray-600">
        {children}
      </div>
    </section>
  );
}

function TermsOfService() {
  const { navigate } = useRouter();

  useMeta(TERMS_META);

  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      {/* Hero */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm font-medium text-[#FF6201]">
            Razia Driving Center
          </p>
          <p className="mt-4 text-base text-gray-500">
            Last updated: October 16, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6">

          <Section title="1. Introduction and Acceptance">
            <p>
              These Terms of Service ("Terms") apply to every visitor who accesses
              or uses the website of Razia Driving Center ("we", "our", "the
              business"), contacts us, or inquires about our driving lessons and
              services. By using our website or communicating with us, you agree
              to these Terms. If you do not agree with any part of these Terms,
              please discontinue use of the website.
            </p>
          </Section>

          <Section title="2. Services and Website Information">
            <p>
              Our website provides information about driving lessons, courses,
              schedules, pricing, and ways to contact the driving center. Course
              availability, lesson arrangements, and service details are subject
              to confirmation directly with Razia Driving Center.
            </p>
            <p>
              While we aim to keep the information on our website accurate and
              up to date, we do not guarantee that every displayed service, course
              description, or time slot is always available. Specific
              availability should be confirmed with the driving center before
              making any arrangements.
            </p>
          </Section>

          <Section title="3. Course Bookings and Scheduling">
            <p>
              Inquiries or booking requests submitted through our website,
              WhatsApp, phone, or any other communication channel are subject to
              confirmation by Razia Driving Center. A request is not a confirmed
              booking until the driving center confirms it directly with you.
            </p>
            <p>
              Lesson times may need to be rescheduled due to instructor
              availability, traffic conditions, weather, safety considerations,
              or other operational circumstances. We will communicate any changes
              to scheduled lessons as promptly as reasonably possible.
            </p>
          </Section>

          <Section title="4. Course Fees and Payments">
            <p>
              Applicable course fees and any pickup/drop-off charges will be
              communicated and confirmed before the service is arranged. Current
              course pricing displayed on our website is:</p>
            <ul className="ml-5 list-disc space-y-1">
              <li><strong className="text-gray-800">Basic Plan</strong> — Rs. 9,999 (7 days training)</li>
              <li><strong className="text-gray-800">PLUS Plan</strong> — Rs. 14,500 (10 days training)</li>
              <li><strong className="text-gray-800">PRO+ Plan</strong> — Rs. 21,750 (15 days training)</li>
            </ul>
            <p>
              Pick and drop is available across Lahore up to a 20 km radius. The
              first 2 km is free on the PLUS Plan. Pickup and drop charges are
              calculated based on distance and course duration, and will be
              confirmed before the service is arranged.
            </p>
            <p>
              If you have questions about fees, charges, or payment arrangements,
              please contact the driving center for clarification before booking
              or making any payment.
            </p>
          </Section>

          <Section title="5. Student Responsibilities and Safety">
            <p>
              Students must follow the instructor's safety instructions at all
              times and comply with applicable traffic laws of Pakistan. Students
              must provide accurate and complete information relevant to arranging
              lessons, including valid learner permit or licence details where
              applicable.
            </p>
            <p>
              Students must not behave in a way that endangers themselves, the
              instructor, passengers, pedestrians, or other road users. Razia
              Driving Center reserves the right to pause, change, or discontinue a
              lesson when reasonably necessary for the safety of any person or due
              to unsafe conditions.
            </p>
          </Section>

          <Section title="6. Driving Licence and Legal Compliance">
            <p>
              Students remain personally responsible for meeting all applicable
              learner permit, driving licence, and legal eligibility requirements
              in Punjab, Pakistan. Completion of a driving course does not
              guarantee issuance of a driving licence or passing of any driving
              test.
            </p>
            <p>
              For current and official information about learner permits and
              licensing requirements, please consult the relevant Punjab traffic
              authorities directly.
            </p>
          </Section>

          <Section title="7. Website Accuracy and Changes">
            <p>
              Razia Driving Center makes reasonable efforts to keep website
              information accurate and current. However, errors, outdated
              information, and temporary interruptions may occur.
            </p>
            <p>
              We may update course descriptions, prices, website content, and
              these Terms when necessary. Changes will be reflected on the website
              with an updated date. A price that has already been confirmed for a
              specific booking will not be changed retroactively without mutual
              agreement.
            </p>
          </Section>

          <Section title="8. Third-Party Services and Google Reviews">
            <p>
              Our website may display publicly available business reviews and
              associated reviewer information originating from Google through its
              Business Profile services. These reviews are subject to Google's own
              terms and policies.
            </p>
            <p>
              External links and third-party services accessible through our
              website are governed by their respective providers' terms and
              policies. Razia Driving Center does not control and is not
              responsible for the content or practices of third-party websites.
            </p>
          </Section>

          <Section title="9. Intellectual Property and Website Use">
            <p>
              The website's text, branding, graphics, and other original content
              belong to Razia Driving Center and may not be copied, republished,
              or misused without our prior permission, except where permitted by
              applicable law.
            </p>
            <p>
              You must not attempt to disrupt the website, misuse its forms,
              APIs, or other features, or use the website for any unlawful
              purpose. Any unauthorized or abusive use may result in restricted
              access and may be pursued under applicable law.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              Razia Driving Center does not guarantee uninterrupted or error-free
              operation of the website. To the extent permitted by applicable
              law, the business is not liable for any indirect, incidental, or
              consequential loss or damage arising from the use of, or inability
              to use, the website or its content.
            </p>
            <p>
              Nothing in these Terms removes or limits any rights or liabilities
              that cannot legally be excluded under the laws of Pakistan.
            </p>
          </Section>

          <Section title="11. Privacy">
            <p>
              Personal information collected through our website is handled as
              described in our Privacy Policy:{" "}
              <a
                href="/privacy-policy/"
                className="font-medium text-[#FF6201] underline"
              >
                https://raziadrivingcenter.com/privacy-policy
              </a>
            </p>
          </Section>

          <Section title="12. Governing Law and Disputes">
            <p>
              These Terms are governed by the applicable laws of Pakistan. Any
              disputes arising from the use of the website or these Terms shall be
              subject to the competent courts or authorities in Lahore, to the
              extent legally appropriate, without affecting any mandatory legal
              protections available to users under applicable law.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              These Terms may be updated periodically to reflect changes in our
              services, operations, or legal requirements. The revised version
              will be published on this page with an updated "Last updated" date.
              We encourage you to review this page periodically.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <div className="space-y-2">
              <p className="font-semibold text-gray-800">Razia Driving Center</p>
              <p>Gulberg 2, Lahore, Pakistan</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:raziadrivingcenter@gmail.com"
                  className="text-[#FF6201] underline"
                >
                  raziadrivingcenter@gmail.com
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href="tel:+923094461407"
                  className="text-[#FF6201] underline"
                >
                  +92 309 4461407
                </a>
              </p>
            </div>
          </Section>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <a
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gray-900 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gray-800"
            >
              Back to Home
            </a>
          </div>

        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default TermsOfService;
