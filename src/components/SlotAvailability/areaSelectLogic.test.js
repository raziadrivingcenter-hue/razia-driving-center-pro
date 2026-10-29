// Pure-logic tests for AreaSelect — run with: node --test
import { test } from "node:test";
import assert from "node:assert";
import {
  OTHER_VALUE,
  buildOptions,
  optionLabel,
  triggerLabel,
  indexOfValue,
  moveHighlight,
  typeaheadMatch,
  reducer,
  initialState,
} from "./areaSelectLogic.js";

const TOWNS = ["Gulberg", "Wapda Town", "DHA"];
const OPTIONS = buildOptions(TOWNS); // ["Gulberg","Wapda Town","DHA","__other__"]

test("buildOptions appends the Other sentinel last", () => {
  assert.deepStrictEqual(OPTIONS, ["Gulberg", "Wapda Town", "DHA", OTHER_VALUE]);
});

test("optionLabel maps Other sentinel to display text", () => {
  assert.strictEqual(optionLabel("Gulberg"), "Gulberg");
  assert.strictEqual(optionLabel(OTHER_VALUE), "Other");
});

test("triggerLabel shows placeholder when empty, label otherwise", () => {
  assert.strictEqual(triggerLabel("", "Select your area"), "Select your area");
  assert.strictEqual(triggerLabel("Gulberg", "Select your area"), "Gulberg");
  assert.strictEqual(triggerLabel(OTHER_VALUE, "Select your area"), "Other");
});

test("indexOfValue finds towns and Other, -1 for empty", () => {
  assert.strictEqual(indexOfValue("Wapda Town", OPTIONS), 1);
  assert.strictEqual(indexOfValue(OTHER_VALUE, OPTIONS), 3);
  assert.strictEqual(indexOfValue("", OPTIONS), -1);
  assert.strictEqual(indexOfValue("Nowhere", OPTIONS), -1);
});

test("moveHighlight wraps down and up", () => {
  assert.strictEqual(moveHighlight(0, "ArrowDown", 4), 1);
  assert.strictEqual(moveHighlight(3, "ArrowDown", 4), 0); // wrap
  assert.strictEqual(moveHighlight(0, "ArrowUp", 4), 3); // wrap
  assert.strictEqual(moveHighlight(2, "ArrowUp", 4), 1);
});

test("moveHighlight jumps to ends", () => {
  assert.strictEqual(moveHighlight(1, "Home", 4), 0);
  assert.strictEqual(moveHighlight(1, "End", 4), 3);
});

test("moveHighlight returns -1 for empty list", () => {
  assert.strictEqual(moveHighlight(0, "ArrowDown", 0), -1);
});

test("typeahead matches case-insensitively and circularly", () => {
  assert.strictEqual(typeaheadMatch("w", OPTIONS), 1); // Wapda Town
  assert.strictEqual(typeaheadMatch("W", OPTIONS), 1);
  assert.strictEqual(typeaheadMatch("d", OPTIONS), 2); // DHA
  assert.strictEqual(typeaheadMatch("g", OPTIONS), 0); // Gulberg
});

test("typeahead wraps past the end to find a match", () => {
  // "g" from index 1 should wrap to index 0 (Gulberg)
  assert.strictEqual(typeaheadMatch("g", OPTIONS, 2), 0);
});

test("typeahead returns -1 when nothing matches", () => {
  assert.strictEqual(typeaheadMatch("zzz", OPTIONS), -1);
});

test("typeahead matches the Other option by its label", () => {
  assert.strictEqual(typeaheadMatch("o", OPTIONS), 3); // Other
});

// ---- Reducer (state machine) ----

test("toggle opens and highlights the selected value", () => {
  const s = reducer(initialState, { type: "toggle", selectedIndex: 1 }, OPTIONS);
  assert.strictEqual(s.open, true);
  assert.strictEqual(s.highlighted, 1);
});

test("toggle from empty selection highlights index 0", () => {
  const s = reducer(initialState, { type: "toggle", selectedIndex: -1 }, OPTIONS);
  assert.strictEqual(s.highlighted, 0);
});

test("toggle when open closes", () => {
  const open = { open: true, highlighted: 2, typeahead: "" };
  const s = reducer(open, { type: "toggle", selectedIndex: 1 }, OPTIONS);
  assert.strictEqual(s.open, false);
  assert.strictEqual(s.highlighted, -1);
});

test("close clears highlight and typeahead", () => {
  const open = { open: true, highlighted: 2, typeahead: "w" };
  const s = reducer(open, { type: "close" }, OPTIONS);
  assert.deepStrictEqual(s, { open: false, highlighted: -1, typeahead: "" });
});

test("openFromEnd highlights the last option", () => {
  const s = reducer(initialState, { type: "openFromEnd" }, OPTIONS);
  assert.strictEqual(s.open, true);
  assert.strictEqual(s.highlighted, 3);
});

test("move updates highlight within open state", () => {
  const open = { open: true, highlighted: 0, typeahead: "" };
  const s = reducer(open, { type: "move", key: "ArrowDown" }, OPTIONS);
  assert.strictEqual(s.highlighted, 1);
});

test("typeahead sets highlight and accumulates the buffer", () => {
  const open = { open: true, highlighted: -1, typeahead: "" };
  const s = reducer(open, { type: "typeahead", char: "w" }, OPTIONS);
  assert.strictEqual(s.highlighted, 1);
  assert.strictEqual(s.typeahead, "w");
});

test("resetTypeahead clears the buffer but keeps highlight", () => {
  const open = { open: true, highlighted: 1, typeahead: "w" };
  const s = reducer(open, { type: "resetTypeahead" }, OPTIONS);
  assert.strictEqual(s.highlighted, 1);
  assert.strictEqual(s.typeahead, "");
});

test("openAndTypeahead opens and highlights the matched option", () => {
  const s = reducer(initialState, { type: "openAndTypeahead", char: "w", selectedIndex: -1 }, OPTIONS);
  assert.strictEqual(s.open, true);
  assert.strictEqual(s.highlighted, 1); // Wapda Town
  assert.strictEqual(s.typeahead, "w");
});

test("openAndTypeahead falls back to base highlight when no match", () => {
  const s = reducer(initialState, { type: "openAndTypeahead", char: "zzz", selectedIndex: 2 }, OPTIONS);
  assert.strictEqual(s.open, true);
  assert.strictEqual(s.highlighted, 2); // base selectedIndex preserved
});

test("setHighlight changes highlight directly (mouse hover)", () => {
  const open = { open: true, highlighted: 0, typeahead: "" };
  const s = reducer(open, { type: "setHighlight", index: 2 }, OPTIONS);
  assert.strictEqual(s.highlighted, 2);
});
