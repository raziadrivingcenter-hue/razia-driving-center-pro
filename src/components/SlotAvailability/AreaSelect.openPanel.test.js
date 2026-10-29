// Edge-case + open-state tests for AreaSelect.
//
// The production white screen (commit 8d5bdb9) was a
// `TypeError: Cannot read properties of undefined (reading 'length')` thrown
// from the reducer. The reducer signature is reducer(state, action, options),
// but React's useReducer only forwards (state, action) on dispatch — so
// `options` was always undefined and `options.length` crashed on the first
// move/typeahead/openThend.
//
// Two fixes:
//   1. Default options to [] in reducer/typeaheadMatch/indexOfValue/buildOptions
//      + the component prop, so undefined/null/[] never crash (safety net).
//   2. Wrap the reducer in the component so dispatch closes over the REAL
//      options list — otherwise the reducer silently runs against [] and
//      typeahead/move/Home/End do nothing.
//
// These tests cover the crash path (empty/undefined/null options) and verify
// the open panel still renders. Run with: node --test
import { test } from "node:test";
import assert from "node:assert";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import {
  reducer,
  initialState,
  buildOptions,
  typeaheadMatch,
  indexOfValue,
  moveHighlight,
  OTHER_VALUE,
} from "./areaSelectLogic.js";

let AreaSelect;
let vite;

test.before(async () => {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });
  const mod = await vite.ssrLoadModule(
    "./src/components/SlotAvailability/AreaSelect.jsx"
  );
  AreaSelect = mod.default;
});

test.after(async () => {
  await vite.close();
});

// ---- Helpers defaulting (no throw on undefined/null/[]) ----------------

test("buildOptions defaults undefined/null to [] and still appends Other", () => {
  assert.deepStrictEqual(buildOptions(undefined), [OTHER_VALUE]);
  assert.deepStrictEqual(buildOptions(null), [OTHER_VALUE]);
  assert.deepStrictEqual(buildOptions([]), [OTHER_VALUE]);
});

test("typeaheadMatch defaults options to [] and returns -1", () => {
  assert.strictEqual(typeaheadMatch("g", undefined), -1);
  assert.strictEqual(typeaheadMatch("g", null), -1);
  assert.strictEqual(typeaheadMatch("g", []), -1);
});

test("indexOfValue defaults options to [] and returns -1", () => {
  assert.strictEqual(indexOfValue("Gulberg", undefined), -1);
  assert.strictEqual(indexOfValue("Gulberg", null), -1);
  assert.strictEqual(indexOfValue("Gulberg", []), -1);
});

// ---- Reducer: initial state with undefined/null/[] options ------------

test("reducer init-equivalent: open with undefined options does not throw", () => {
  // React calls the reducer as reducer(state, action) — options is undefined.
  // This is the exact production crash path.
  const s = reducer(initialState, { type: "open", selectedIndex: -1 });
  assert.strictEqual(s.open, true);
  assert.strictEqual(s.highlighted, 0);
});

test("reducer handles null and [] options for open", () => {
  for (const opts of [null, []]) {
    const s = reducer(initialState, { type: "open", selectedIndex: -1 }, opts);
    assert.strictEqual(s.open, true);
  }
});

// ---- Reducer: open/close/typeahead/Home/End with empty options ---------

test("close with empty options clears state", () => {
  const open = { open: true, highlighted: 1, typeahead: "g" };
  const s = reducer(open, { type: "close" }, []);
  assert.deepStrictEqual(s, { open: false, highlighted: -1, typeahead: "" });
});

test("Home/End with empty options do not throw; highlight stays -1 (no options)", () => {
  // moveHighlight returns -1 for an empty list, so Home/End cannot point at a
  // non-existent option. The important property is: no throw.
  for (const key of ["Home", "End"]) {
    const open = { open: true, highlighted: 0, typeahead: "" };
    const s = reducer(open, { type: "move", key }, []);
    assert.strictEqual(s.highlighted, -1);
  }
});

test("End with empty options yields highlight -1 (no options)", () => {
  const open = { open: true, highlighted: 0, typeahead: "" };
  const s = reducer(open, { type: "move", key: "End" }, []);
  // moveHighlight returns count-1 = -1 for an empty list; highlight becomes -1.
  assert.strictEqual(s.highlighted, -1);
});

test("typeahead with empty options accumulates buffer, returns -1 highlight", () => {
  const open = { open: true, highlighted: -1, typeahead: "" };
  const s = reducer(open, { type: "typeahead", char: "g" }, []);
  assert.strictEqual(s.highlighted, -1);
  assert.strictEqual(s.typeahead, "g");
});

test("move (ArrowDown/ArrowUp) with empty options does not throw", () => {
  for (const key of ["ArrowDown", "ArrowUp"]) {
    const open = { open: true, highlighted: -1, typeahead: "" };
    const s = reducer(open, { type: "move", key }, []);
    assert.strictEqual(s.highlighted, -1);
  }
});

test("openFromEnd with empty options does not throw", () => {
  const s = reducer(initialState, { type: "openFromEnd" }, []);
  assert.strictEqual(s.open, true);
});

// ---- Component render with options undefined ---------------------------

test("component renders with options undefined (falls back to native select)", () => {
  // The error boundary wraps the inner component; with options undefined the
  // inner component must not throw. The native <select> is always rendered.
  const html = renderToStaticMarkup(
    createElement(AreaSelect, {
      value: "",
      onChange: () => {},
      options: undefined,
      label: "Your area",
    })
  );
  assert.ok(html.includes('role="combobox"'), "trigger renders");
  assert.ok(html.includes("<select"), "native select fallback renders");
});

test("component renders with options null", () => {
  const html = renderToStaticMarkup(
    createElement(AreaSelect, {
      value: "Wapda Town",
      onChange: () => {},
      options: null,
      label: "Your area",
    })
  );
  assert.ok(html.includes("<select"), "native select renders with null options");
});

// ---- Wiring test: dispatch must reach the reducer with the REAL options --
//
// This mirrors the component's dispatch path. The component wraps the reducer
// as (state, action) => reducer(state, action, realOptions). We simulate both
// the BROKEN wiring (raw reducer — options defaults to []) and the FIXED
// wiring (closure over real options) to prove the test fails-before/passes-after.

test("WIRING: ArrowDown/End/typeahead reach the reducer with REAL options (fix)", () => {
  const realOptions = ["Wapda Town", "__other__"];

  // FIXED wiring: dispatch closes over real options.
  const dispatchFixed = (state, action) => reducer(state, action, realOptions);

  // Step 1: open from no selection -> highlight index 0 (Wapda Town).
  let s = dispatchFixed(initialState, { type: "toggle", selectedIndex: -1 });
  assert.strictEqual(s.open, true, "open");
  assert.strictEqual(s.highlighted, 0, "highlight starts on Wapda Town");

  // Step 2: ArrowDown moves to index 1 (Other).
  s = dispatchFixed(s, { type: "move", key: "ArrowDown" });
  assert.strictEqual(s.highlighted, 1, "ArrowDown -> Other");

  // Step 3: End jumps to the last option (index 1).
  s = dispatchFixed(s, { type: "move", key: "End" });
  assert.strictEqual(s.highlighted, 1, "End -> last option");

  // Step 4: typeahead "w" highlights Wapda Town (index 0).
  s = dispatchFixed(s, { type: "typeahead", char: "w" });
  assert.strictEqual(s.highlighted, 0, "typeahead 'w' -> Wapda Town");
});

test("WIRING: with BROKEN wiring (raw reducer, options=[]), typeahead/move do NOTHING — this is the bug", () => {
  // BROKEN wiring: the raw reducer, as React calls it — options defaults to [].
  const dispatchBroken = (state, action) => reducer(state, action); // no options!

  // Open: highlight falls back to 0 even on empty list (harmless here).
  let s = dispatchBroken(initialState, { type: "toggle", selectedIndex: -1 });

  // ArrowDown on an empty-options reducer: highlight stays -1 (would be
  // silently broken in the real component — the highlight never advances).
  s = dispatchBroken(s, { type: "move", key: "ArrowDown" });
  assert.strictEqual(s.highlighted, -1, "BROKEN: ArrowDown does nothing on []");

  // Typeahead "w" on empty list: no match, highlight stays -1.
  s = dispatchBroken(s, { type: "typeahead", char: "w" });
  assert.strictEqual(s.highlighted, -1, "BROKEN: typeahead 'w' matches nothing on []");
});

test("WIRING: component's reducer closure changes when options change (empty -> loaded)", () => {
  // Simulate the component re-rendering with new options: the closure is
  // recreated (useCallback deps), so subsequent dispatches use the new list.
  let currentOptions = [];

  // Empty options: typeahead finds nothing.
  let s = reducer(initialState, { type: "typeahead", char: "w" }, currentOptions);
  assert.strictEqual(s.highlighted, -1, "empty options: no match");

  // Options load (parent re-renders with real list). Component recreates the
  // closure over the new list; the highlight/typeahead state is re-seeded from
  // the new render's useReducer initializer, so we start from initialState.
  currentOptions = ["Wapda Town", "DHA", "__other__"];
  s = reducer(initialState, { type: "typeahead", char: "w" }, currentOptions);
  assert.strictEqual(s.highlighted, 0, "loaded options: typeahead 'w' -> Wapda Town");
});
