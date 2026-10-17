import { useState } from "react";
import { useMeta } from "../useMeta";
import { useRouter } from "../router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import ScrollProgress from "./ScrollProgress";

const META = {
  en: {
    title: "Payment Procedure | Razia Driving Center",
    description:
      "Learn about the payment procedure for Razia driving Center in Lahore — 50% on first lesson, remainder before mid-course.",
    canonical: "https://raziadrivingcenter.com/payment-procedure/",
  },
  ur: {
    title: "ادائیگی کی طریقہ کار | راضیۈ ڈرائیونگ سینٹر",
    description:
      "راضیہ ڈرائیونگ سینٹر لاہور کے ادائیگی کے طریقہ کار کے بارے میں جانیں — پہلی سبق مکمل ہونے پر 50%، باقی نصف سبق سے پہلے۔",
    canonical: "https://raziadrivingcenter.com/payment-procedure/",
  },
};

const CONTENT = {
  en: {
    heroTitle: "Payment Procedure",
    lastUpdated: "Last updated: October 17, 2026",
    sections: [
      {
        title: "1. Payment Policy Overview",
        body: (
          <p>
            At <strong className="text-gray-800">Razia Driving Center</strong>, we follow a
            simple and transparent payment structure so students know exactly when and how
            much to pay. The total course fee is split into two installments.
          </p>
        ),
      },
      {
        title: "2. First Installment — 50% on First Lesson Completion",
        body: (
          <div className="space-y-3">
            <p>
              The student must pay <strong className="text-gray-800">50% of the total payable
              amount</strong> upon completion of the <strong className="text-gray-800">first lesson</strong>.
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>This confirms your commitment to the course.</li>
              <li>
                It can be paid in <strong className="text-gray-800">cash</strong> directly to
                the instructor at the end of the first lesson, or via bank transfer / EasyPaisa / JazzCash.
              </li>
              <li>You will receive a confirmation message once the payment is recorded.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "3. Pick & Drop Option",
        body: (
          <div className="space-y-3">
            <p>
              If you have chosen the <strong className="text-gray-800">Pick & Drop</strong> option
              with your plan/course, you are <strong className="text-gray-800">not required to come
              to our center</strong>. The instructor will reach your enrolled pickup location at the
              scheduled time.
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                You are already enrolled with your chosen plan/course — no separate registration is needed.
              </li>
              <li>
                You can pay the <strong className="text-gray-800">first installment (50%) after your
                first lesson is complete</strong>, directly to the instructor at your pickup location.
              </li>
            </ul>
          </div>
        ),
      },
      {
        title: "4. Second Installment — Remaining 50% Before Mid-Course",
        body: (
          <div className="space-y-3">
            <p>
              The remaining <strong className="text-gray-800">50% balance</strong> must be paid
              at least <strong className="text-gray-800">one day before the midpoint</strong> of
              the course.
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                For example, if your course is 20 lessons, the second installment is due before lesson 11.
              </li>
              <li>
                Timely payment ensures your lesson schedule remains uninterrupted.
              </li>
              <li>Failure to pay by the deadline may result in a pause of remaining lessons.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "5. Accepted Payment Methods",
        body: (
          <ul className="ml-5 list-disc space-y-2">
            <li><strong className="text-gray-800">Cash</strong> — paid directly to the instructor.</li>
            <li><strong className="text-gray-800">Bank Transfer</strong> — details shared at the time of booking.</li>
            <li><strong className="text-gray-800">EasyPaisa</strong> — mobile wallet payment.</li>
            <li><strong className="text-gray-800">JazzCash</strong> — mobile wallet payment.</li>
          </ul>
        ),
      },
      {
        title: "6. Proof of Payment",
        body: (
          <p>
            After making any payment, please share the receipt or screenshot with us on{" "}
            <a href="https://wa.me/923094461407" target="_blank" rel="noopener noreferrer" className="font-medium text-[#FF6201] underline">
              WhatsApp
            </a>{" "}
            so we can update your record immediately.
          </p>
        ),
      },
      {
        title: "7. Questions About Payment?",
        body: (
          <div className="space-y-2">
            <p>
              If you have any questions about the payment procedure, installments, or accepted
              methods, please contact us:
            </p>
            <p>
              WhatsApp:{" "}
              <a href="https://wa.me/923094461407" target="_blank" rel="noopener noreferrer" className="text-[#FF6201] underline">
                +92 309 4461407
              </a>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:raziadrivingcenter@gmail.com" className="text-[#FF6201] underline">
                raziadrivingcenter@gmail.com
              </a>
            </p>
          </div>
        ),
      },
    ],
    backToHome: "Back to Home",
    switchLang: "اردو",
  },
  ur: {
    heroTitle: "ادائیگی کا طریقہ کار",
    lastUpdated: "آخری اپڈیٹ: 17 اکتوبر 2026",
    sections: [
      {
        title: "۱۔ ادائیگی کی پالیسی",
        body: (
          <p>
            <strong className="text-gray-800">راضیہ ڈرائیونگ سینٹر</strong> میں ہم ایک سادہ اور
            شفاف ادائیگی کا نظام اپناتے ہیں تاکہ طالب علموں کو معلوم �وو کہ کتنی رقم اور کب ادا کرنی ہے۔
            پورے کورس کی فیس دو قسطوں میں تقسیم کی جاتی ہے۔
          </p>
        ),
      },
      {
        title: "۲۔ پہلی قسط — پہلی سبق مکمل ہونے پر 50%",
        body: (
          <div className="space-y-3">
            <p>
              طالب علم کو <strong className="text-gray-800">پہلی سبق کے مکمل ہونے پر</strong>{" "}
              کل ادائیگی کا <strong className="text-gray-800">50%</strong> ادا کرنا ہوگا۔
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>یہ آپ کے کورس کی تکمیل کا ظاہر کرتا ہے۔</li>
              <li>
                اسے <strong className="text-gray-800">نقد</strong> طور پر پہلی سبق کے آخر میں
                انسٹرکٹر کو دیا جا سکتا ہے، یا بینک ٹرانسفر / آئی پیسا / جیز کیش کے ذریعے۔
              </li>
              <li>ادائیگی ریکارڈ ہونے پر آپ کو تصدیقی پیغام بھیجاجائے گا۔</li>
            </ul>
          </div>
        ),
      },
      {
        title: "۳۔ پِک اینڈ ڈراپ آپشن",
        body: (
          <div className="space-y-3">
            <p>
              اگر آپ نے اپنے پلان/کورس کے ساتھ{" "}
              <strong className="text-gray-800">پِک اینڈ ڈراپ</strong> آپشن چنا ہے تو{" "}
              <strong className="text-gray-800">آپ کو ہمارے مرکز آنے کی ضرورت نہیں</strong>۔ انسٹرکٹر
              مقررہ وقت پر آپ کے پِک لوکیشن پر آئے گا۔
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                آپ پہلے سے اپنے منتخب پلان/کورس کے ساتھ انرول ہیں — علیحدہ رجسٹریشن کی ضرورت نہیں۔
              </li>
              <li>
                آپ <strong className="text-gray-800">پہلی قسط (50%) پہلی سبق کے بعد مکمل طور پر
                ادا کر سکتے ہیں</strong>، براہ راست انسٹرکٹر کو اپنے پِک لوکیشن پر۔
              </li>
            </ul>
          </div>
        ),
      },
      {
        title: "۴۔ دوسری قسط — باقی 50% نصف کورس سے پہلے",
        body: (
          <div className="space-y-3">
            <p>
              باقی <strong className="text-gray-800">50%</strong> رقم{" "}
              <strong className="text-gray-800">کورس کے نصف حصے سے ایک دن پہلے</strong> ادا کرنا
              ضروری ہے۔
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                مثال کے طور پر، اگر آپ کا کورس 20 سبق کا ہے تو دوسری قسط سبق 11 سے پہلے ہے۔
              </li>
              <li>
                وقت پر ادائیگی سے آپ کے سبقوں کا شیڈول جاری رہتا ہے۔
              </li>
              <li>وقت پر ادائیگی نہ کرنے پر باقی سبق روکدیے جاسکتے ہیں۔</li>
            </ul>
          </div>
        ),
      },
      {
        title: "۵۔ قبول شدہ ادائیگی کے طریقے",
        body: (
          <ul className="ml-5 list-disc space-y-2">
            <li><strong className="text-gray-800">نقد</strong> — براہ راست انسٹرکٹر کو ادا کریں۔</li>
            <li><strong className="text-gray-800">بینک ٹرانسفر</strong> — بکنگ کے وقت تفصیلات فراہم کی جائیں گی۔</li>
            <li><strong className="text-gray-800">آئی پیسا</strong> — موبائل والٹ ادائیگی۔</li>
            <li><strong className="text-gray-800">جیز کیش</strong> — موبائل والٹ ادائیگی۔</li>
          </ul>
        ),
      },
      {
        title: "۶۔ ادائیگی کا ثبوت",
        body: (
          <p>
            کسی بھی ادائیگی کے بعد، براہ کم رسید یا اسکرین شاٹ ہمیں{" "}
            <a href="https://wa.me/923094461407" target="_blank" rel="noopener noreferrer" className="font-medium text-[#FF6201] underline">
              واٹس ایپ
            </a>{" "}
            پر بھیجیں تاکہ ہم آپ کا ریکارڈ فوری اپڈیٹ کر سکیں۔
          </p>
        ),
      },
      {
        title: "۷۔ ادائیگی سے متعلق سوالات؟",
        body: (
          <div className="space-y-2">
            <p>
              اگر آپ کو ادائیگی کے طریقہ کار، قسطوں، یا قبول شدہ طریقوں کے بارے میں کوئی سوال ہو تو ہم سے رابطہ کریں:
            </p>
            <p>
              واٹس ایپ:{" "}
              <a href="https://wa.me/923094461407" target="_blank" rel="noopener noreferrer" className="text-[#FF6201] underline">
                +92 309 4461407
              </a>
            </p>
            <p>
              ای میل:{" "}
              <a href="mailto:raziadrivingcenter@gmail.com" className="text-[#FF6201] underline">
                raziadrivingcenter@gmail.com
              </a>
            </p>
          </div>
        ),
      },
    ],
    backToHome: "واپس ہوم پیج پر",
    switchLang: "English",
  },
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

function PaymentProcedure() {
  const { navigate } = useRouter();
  const [lang, setLang] = useState("en");

  const t = CONTENT[lang];
  const isUrdu = lang === "ur";

  useMeta(META[lang]);

  return (
    <>
      <ScrollProgress />
      <Navbar onBookNow={() => navigate("/#contact")} />

      {/* Hero */}
      <section className={isUrdu ? "bg-gray-50 py-16 md:py-20" : "bg-gray-50 py-16 md:py-20"} dir={isUrdu ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className={isUrdu ? "text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl" : "text-3xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl"}>
            {t.heroTitle}
          </h1>
          {!isUrdu && (
            <p className="mt-2 text-sm font-medium text-[#FF6201]">
              Razia Driving Center
            </p>
          )}
          <p className={isUrdu ? "mt-4 text-base text-gray-500" : "mt-4 text-base text-gray-500"}>
            {t.lastUpdated}
          </p>

          {/* Language Toggle */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setLang(isUrdu ? "en" : "ur")}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-[#FF6201] hover:text-[#FF6201]"
            >
              <span className="text-base">🌐</span>
              {t.switchLang}
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-12 md:py-16" dir={isUrdu ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-4xl px-6">

          {t.sections.map((s) => (
            <Section key={s.title} title={s.title}>
              {s.body}
            </Section>
          ))}

          <div className="mt-10 border-t border-gray-200 pt-6">
            <button
              onClick={() => navigate("/")}
              className="inline-flex h-11 items-center justify-center rounded-md bg-gray-900 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gray-800"
            >
              {t.backToHome}
            </button>
          </div>

        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default PaymentProcedure;
