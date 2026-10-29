// =============================================================================
// Pure helpers + state machine for <AreaSelect/>.
// No React, no DOM — safe to unit-test with `node --test`.
// The component is a thin DOM-binding layer over these functions.
// =============================================================================

// The sentinel value used for the "Other" option. Must match the value the
// parent (SlotAvailability) reads/writes, so it is shared here as the single
// source of truth.
export const OTHER_VALUE = "__other__";

// The selectable list: distinct towns + the "Other" sentinel. The placeholder
// ("Select your area") is intentionally NOT an option — it is only the
// trigger's empty-state label.
export function buildOptions(towns) {
  return [...towns, OTHER_VALUE];
}

// Display label for a value. Only "Other" differs from the raw value.
export function optionLabel(value) {
  return value === OTHER_VALUE ? "Other" : value;
}

// Trigger label: placeholder when empty, otherwise the option label.
export function triggerLabel(value, placeholder) {
  return value ? optionLabel(value) : placeholder;
}

// Index of `value` in the option list, or -1 when empty / not found.
export function indexOfValue(value, options) {
  if (!value) return -1;
  return options.indexOf(value);
}

// Move the keyboard highlight with wrapping. Returns -1 when list is empty.
export function moveHighlight(current, key, count) {
  if (count <= 0) return -1;
  switch (key) {
    case "ArrowDown":
      return (current + 1) % count;
    case "ArrowUp":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return current;
  }
}

// Typeahead: first option whose label starts with `query` (case-insensitive),
// searching circularly from `startIndex`. Returns -1 when nothing matches.
export function typeaheadMatch(query, options, startIndex = 0) {
  if (!query) return -1;
  const q = query.toLowerCase();
  const n = options.length;
  for (let i = 0; i < n; i++) {
    const idx = (startIndex + i) % n;
    if (optionLabel(options[idx]).toLowerCase().startsWith(q)) return idx;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// State machine for the dropdown's open/highlight/typeahead state.
// Actions: open | openFromEnd | toggle | close | move | typeahead |
//          resetTypeahead | setHighlight
// ---------------------------------------------------------------------------
export const initialState = { open: false, highlighted: -1, typeahead: "" };

export function reducer(state, action, options) {
  const count = options.length;
  switch (action.type) {
    case "open":
      return {
        open: true,
        highlighted: action.selectedIndex >= 0 ? action.selectedIndex : 0,
        typeahead: "",
      };
    // Open from a keystroke that already carries a typeahead char (typing
    // while closed). Opens and applies the char search atomically so the open
    // action cannot clobber the match that typeahead just computed.
    case "openAndTypeahead": {
      const base = action.selectedIndex >= 0 ? action.selectedIndex : 0;
      const idx = typeaheadMatch(action.char, options, base);
      return { open: true, highlighted: idx >= 0 ? idx : base, typeahead: action.char };
    }
    case "openFromEnd":
      return { open: true, highlighted: Math.max(0, count - 1), typeahead: "" };
    case "toggle":
      if (state.open) return { open: false, highlighted: -1, typeahead: "" };
      return {
        open: true,
        highlighted: action.selectedIndex >= 0 ? action.selectedIndex : 0,
        typeahead: "",
      };
    case "close":
      return { open: false, highlighted: -1, typeahead: "" };
    case "move":
      return { ...state, highlighted: moveHighlight(state.highlighted, action.key, count) };
    case "typeahead": {
      const next = state.typeahead + action.char;
      const start = state.highlighted + 1;
      const idx = typeaheadMatch(next, options, start);
      return idx >= 0 ? { ...state, highlighted: idx, typeahead: next } : { ...state, typeahead: next };
    }
    case "resetTypeahead":
      return { ...state, typeahead: "" };
    case "setHighlight":
      return { ...state, highlighted: action.index };
    default:
      return state;
  }
}
