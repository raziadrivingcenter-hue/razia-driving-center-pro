import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollProgress from "./ScrollProgress";

const PRIVACY_META = {
  title: "Privacy Policy | Razia Driving Center",
  description:
    "Read the Privacy Policy for Razia Driving Center in Lahore, Pakistan, to learn how we handle personal information and website data.",
  canonical: "https://raziadrivingcenter.com/privacy-policy/",
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

function PrivacyPolicy() {
  const { navigate } = useRouter();

  useMeta(PRIVACY_META);

  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/slot-availability/")} />

      {/* Hero */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            Privacy Policy
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

          <Section title="1. Introduction">
            <p>
              This Privacy Policy describes how Razia Driving Center ("we", "our", or
              "the business") collects, uses, stores, and protects personal
              information when you visit our website, contact us, or inquire about
              driving lessons. By using our website or providing us with your
              information, you agree to the practices described in this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We may collect the following types of information:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="text-gray-800">Contact details</strong> — your
                name, phone number, email address, and any other information you
                submit through inquiry or booking channels on our website.
              </li>
              <li>
                <strong className="text-gray-800">Service communications</strong>{" "}
                — information you share with us through WhatsApp messages,
                telephone calls, emails, or other forms of communication related to
                driving lessons.
              </li>
              <li>
                <strong className="text-gray-800">Lesson preferences</strong> —
                driving lesson preferences, scheduling requests, and other
                service-related communications.
              </li>
              <li>
                <strong className="text-gray-800">Technical information</strong>{" "}
                — basic technical information collected by our website hosting and
                security infrastructure, such as IP addresses and browser type,
                as part of operating and securing the website.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Information">
            <p>We may use the information we collect to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Respond to your inquiries about driving lessons and services.</li>
              <li>Arrange driving lessons and communicate about schedules.</li>
              <li>Provide, improve, and personalize our driving instruction services.</li>
              <li>Maintain the security and integrity of our website and prevent abuse.</li>
              <li>Meet applicable legal and regulatory obligations.</li>
            </ul>
          </Section>

          <Section title="4. Google Services and Third-Party Providers">
            <p>
              Our website displays publicly available business reviews and associated
              reviewer information made available by Google through its Business
              Profile services. Google processes this data under its own privacy
              policies and terms. Razia Driving Center does not collect your Google
              password and cannot access your private Google account information.
            </p>
            <p>
              Our website is hosted and served through Cloudflare, which may process
              technical request data as part of its hosting and security services.
            </p>
            <p>
              Google's Privacy Policy can be reviewed here:{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#FF6201] underline"
              >
                https://policies.google.com/privacy
              </a>
            </p>
          </Section>

          <Section title="5. Cookies and Technical Data">
            <p>
              Our website may use cookies or similar technical mechanisms necessary
              for the website to function. In addition, our hosting and security
              infrastructure may process technical request data (such as access logs)
              as part of operating and securing the website. We do not use optional
              analytics or advertising tracking tools unless explicitly disclosed
              here.
            </p>
          </Section>

          <Section title="6. Sharing and Disclosure">
            <p>
              We do not sell your personal information. We may share information
              only with service providers when necessary to operate our website or
              deliver our services, or when required by applicable law or legal
              process.
            </p>
          </Section>

          <Section title="7. Data Retention and Security">
            <p>
              We retain personal information only as reasonably necessary for
              service, operational, or legal purposes. We take reasonable measures
              to protect the information we hold, but no system can be guaranteed
              to be completely secure.
            </p>
          </Section>

          <Section title="8. Your Choices and Requests">
            <p>
              If you have questions about this policy, or wish to request access to,
              correction of, or deletion of your personal information where
              applicable, or raise a privacy concern, please contact us at:{" "}
              <a
                href="mailto:raziadrivingcenter@gmail.com"
                className="font-medium text-[#FF6201] underline"
              >
                raziadrivingcenter@gmail.com
              </a>
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our website is not intentionally designed to collect personal
              information from children without appropriate involvement or
              authorization from a parent or guardian where required.
            </p>
          </Section>

          <Section title="10. External Links">
            <p>
              Our website may contain links to external websites and third-party
              services. Those websites and services are governed by their own
              privacy policies, and we encourage you to review them.
            </p>
          </Section>

          <Section title="11. Policy Updates">
            <p>
              We may update this Privacy Policy from time to time. Any changes will
              be posted on this page with a revised "Last updated" date. We encourage
              you to review this page periodically.
            </p>
          </Section>

          <Section title="12. Contact Us">
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

export default PrivacyPolicy;
