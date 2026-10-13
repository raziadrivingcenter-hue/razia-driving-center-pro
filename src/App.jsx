import { lazy, Suspense } from "react";
import { useRouter } from "./router";
import Homepage from "./components/Homepage";

// Lazy-load so their code is only downloaded when the visitor navigates there.
const ServicePage = lazy(() => import("./components/ServicePage"));
const DrivingGame = lazy(() => import("./components/DrivingGame/DrivingGame"));

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

  return <Homepage />;
}

export default App;
