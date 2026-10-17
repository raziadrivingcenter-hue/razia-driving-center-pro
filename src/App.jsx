import { lazy, Suspense } from "react";
import { useRouter } from "./router";
import Homepage from "./components/Homepage";

// Lazy-load so their code is only downloaded when the visitor navigates there.
const ServicePage = lazy(() => import("./components/ServicePage"));
const DrivingGame = lazy(() => import("./components/DrivingGame/DrivingGame"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/TermsOfService"));
const SlotAvailability = lazy(() => import("./components/SlotAvailability/SlotAvailability"));
const PaymentProcedure = lazy(() => import("./components/PaymentProcedure"));

function App() {
  const { route } = useRouter();

  if (
    route === "/driving-school-gulberg-lahore/" ||
    route === "/driving-school-gulberg-lahore"
  ) {
    return (
      <Suspense fallback={null}>
        <ServicePage />
      </Suspense>
    );
  }

  if (route === "/driving-test-practice/" || route === "/driving-test-practice") {
    return (
      <Suspense fallback={null}>
        <DrivingGame />
      </Suspense>
    );
  }

  if (route === "/privacy-policy/" || route === "/privacy-policy") {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (route === "/terms/" || route === "/terms") {
    return (
      <Suspense fallback={null}>
        <TermsOfService />
      </Suspense>
    );
  }

  if (route === "/slot-availability/" || route === "/slot-availability") {
    return (
      <Suspense fallback={null}>
        <SlotAvailability />
      </Suspense>
    );
  }

  if (route === "/payment-procedure/" || route === "/payment-procedure") {
    return (
      <Suspense fallback={null}>
        <PaymentProcedure />
      </Suspense>
    );
  }

  return <Homepage />;
}

export default App;
