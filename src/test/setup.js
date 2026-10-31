import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatically unmount and clean up the DOM after each test so state
// never leaks between tests.
afterEach(() => {
  cleanup();
});
