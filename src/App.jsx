import { lazy, Suspense } from "react";
import { useRouter } from "./router";
import Homepage from "./components/Homepage";

// Lazy-load the service page so its ~25 KB of code is only downloaded
// when the visitor actually navigates to /driving-school-gulberg-lahore/.
const ServicePage = lazy(() => import("./components/ServicePage"));

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

  return <Homepage />;
}

export default App;
