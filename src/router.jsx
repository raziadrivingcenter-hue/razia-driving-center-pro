import { createContext, useContext, useState, useEffect, useCallback } from "react";

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => window.location.pathname);
  // When navigating to the homepage from another page, scroll to this section.
  const [scrollTarget, setScrollTarget] = useState(null);

  useEffect(() => {
    const onPopState = () => {
      setRoute(window.location.pathname);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path) => {
    if (path === window.location.pathname) return;
    window.history.pushState({}, "", path);
    setRoute(path);
    window.scrollTo({ top: 0 });
    setScrollTarget(null);
  }, []);

  const navigateToSection = useCallback((sectionId) => {
    window.history.pushState({}, "", "/");
    setRoute("/");
    setScrollTarget(sectionId);
  }, []);

  // After the homepage renders, perform the deferred section scroll.
  useEffect(() => {
    if (route !== "/" || !scrollTarget) return;
    const id = scrollTarget;
    setScrollTarget(null);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [route, scrollTarget]);

  return (
    <RouterContext.Provider value={{ route, navigate, navigateToSection }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}
