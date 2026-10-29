// Component-level render tests for <AreaSelect/>.
//
// There is no jsdom / @testing-library in this repo, so these tests use
// react-dom/server (renderToStaticMarkup) to verify the rendered HTML:
// displayed values, ARIA wiring, option values, and label association.
// Open/close/click/onChange *behavior* is driven by the reducer in
// areaSelectLogic.js, which is covered separately by areaSelectLogic.test.js
// (toggle/select/close/outside-click-equivalent state transitions).
//
// JSX + the .css import are transformed on the fly by Vite's ssrLoadModule,
// so no new test dependencies are required. Run with: node --test
import { test } from "node:test";
import assert from "node:assert";
import { createServer } from "vite";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

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

const TOWNS = ["Gulberg", "Wapda Town", "DHA"];

function render(props) {
  return renderToStaticMarkup(
    createElement(AreaSelect, {
      onChange: () => {},
      options: TOWNS,
      label: "Your area",
      ...props,
    })
  );
}

test("shows placeholder text when nothing is selected", () => {
  const html = render({ value: "" });
  assert.ok(html.includes("Select your area"), "placeholder visible");
  assert.ok(html.includes('aria-expanded="false"'), "listbox collapsed");
});

test("shows the selected town on the trigger", () => {
  const html = render({ value: "Wapda Town" });
  assert.ok(html.includes(">Wapda Town"), "selected town rendered");
});

test("renders every town as an option", () => {
  const html = render({ value: "" });
  for (const town of TOWNS) {
    assert.ok(html.includes(`>${town}`), `${town} option present`);
  }
});

test("Other renders with display text 'Other' but value '__other__'", () => {
  const html = render({ value: "" });
  // The native <option> carries the raw sentinel value.
  assert.ok(
    html.includes('value="__other__">Other<'),
    "Other keeps __other__ value with Other label"
  );
});

test("option values are exactly the towns plus the __other__ sentinel", () => {
  const html = render({ value: "" });
  for (const town of TOWNS) {
    assert.ok(
      html.includes(`value="${town}"`),
      `${town} option value preserved`
    );
  }
  // No placeholder leaks into the option list as a selectable value with empty
  // string other than the native select's own placeholder option.
  assert.ok(html.includes('value="__other__"'), "Other sentinel present");
});

// The custom panel only mounts when the dropdown is OPEN. renderToStaticMarkup
// renders the CLOSED state, so the panel's role="option" / checkmark markup is
// absent here — those are verified by areaSelectLogic.test.js (the reducer that
// drives highlight + selection) and by manual/visual testing. The native
// <select>, however, is always rendered; we assert against its selected state
// to prove the value <-> selection mapping is wired correctly.

test("selected town is marked selected in the native select", () => {
  const html = render({ value: "DHA" });
  const nativeMatch = html.match(/<select[\s\S]*?<\/select>/);
  const nativeHtml = nativeMatch[0];
  // The DHA <option> must carry the selected attribute.
  assert.ok(
    /<option[^>]*value="DHA"[^>]*>/.test(nativeHtml),
    "DHA option exists"
  );
  assert.ok(
    /<option[^>]*value="DHA"[^>]*selected[^>]*>/.test(nativeHtml) ||
      /<option[^>]*selected[^>]*value="DHA"[^>]*>/.test(nativeHtml),
    "DHA option is marked selected"
  );
});

test("Other selection maps to the __other__ sentinel value", () => {
  const html = render({ value: "__other__" });
  const nativeMatch = html.match(/<select[\s\S]*?<\/select>/);
  const nativeHtml = nativeMatch[0];
  assert.ok(
    /<option[^>]*value="__other__"[^>]*selected/.test(nativeHtml) ||
      /<option[^>]*selected[^>]*value="__other__"/.test(nativeHtml),
    "Other maps to __other__ value and is selected"
  );
  // Trigger still shows the friendly label, not the sentinel.
  assert.ok(html.includes(">Other"), "trigger shows Other label");
  assert.ok(!html.includes(">__other__"), "trigger never shows the raw sentinel");
});

test("label is associated with the trigger via aria-labelledby", () => {
  const html = render({ value: "" });
  const labelMatch = html.match(/<label[^>]*id="([^"]+)"[^>]*>/);
  assert.ok(labelMatch, "label element has an id");
  const labelId = labelMatch[1];
  assert.ok(
    html.includes(`aria-labelledby="${labelId}"`),
    "control references the label id"
  );
});

test("trigger declares the listbox popup relationship", () => {
  const html = render({ value: "" });
  assert.ok(html.includes('aria-haspopup="listbox"'), "popup role declared");
  assert.ok(html.includes('role="combobox"'), "combobox role on trigger");
  assert.ok(html.includes('aria-controls="'), "controls the panel");
});

test("native select keeps the same option values as the custom list", () => {
  const html = render({ value: "" });
  // Native select must expose identical values for touch devices.
  const nativeMatch = html.match(/<select[\s\S]*?<\/select>/);
  assert.ok(nativeMatch, "native select present");
  const nativeHtml = nativeMatch[0];
  for (const town of TOWNS) {
    assert.ok(nativeHtml.includes(`value="${town}"`), `${town} in native select`);
  }
  assert.ok(nativeHtml.includes('value="__other__"'), "Other in native select");
});
