import { useId, useReducer, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  OTHER_VALUE,
  buildOptions,
  optionLabel,
  triggerLabel,
  indexOfValue,
  reducer as areaReducer,
  initialState,
} from "./areaSelectLogic";
import "./AreaSelect.css";

const TYPEAHEAD_TIMEOUT = 500;

/**
 * Apple-style dropdown. Props:
 *   value      — current selection ("", a town, or "__other__")
 *   onChange   — (nextValue) => void
 *   options    — array of distinct town strings (Other is appended internally)
 *   label      — visible label text (also the accessible name)
 *   placeholder— trigger text when nothing is selected
 *
 * On touch devices (@media pointer: coarse) a native <select> is shown instead.
 * Both write to the same `value`/`onChange`.
 */
export default function AreaSelect({
  value,
  onChange,
  options,
  label,
  placeholder = "Select your area",
}) {
  const id = useId();
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;
  const labelId = `${id}-label`;

  const allOptions = useMemo(() => buildOptions(options), [options]);
  const selectedIndex = useMemo(
    () => indexOfValue(value, allOptions),
    [value, allOptions]
  );

  const [state, dispatch] = useReducer(areaReducer, initialState, (init) =>
    // Seed highlight from the current selection so opening lands on it.
    ({ ...init, highlighted: indexOfValue(value, allOptions) })
  );
  const { open, highlighted } = state;

  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);
  const typeaheadTimer = useRef(null);

  const normalizedHighlighted =
    open && highlighted >= 0 ? highlighted : -1;

  // ---- Open / close helpers -------------------------------------------
  const openList = useCallback(
    (fromEnd = false) => {
      dispatch(fromEnd ? { type: "openFromEnd" } : { type: "open", selectedIndex });
    },
    [selectedIndex]
  );

  const closeList = useCallback(() => {
    dispatch({ type: "close" });
    triggerRef.current?.focus();
  }, []);

  const selectIndex = useCallback(
    (idx) => {
      const next = allOptions[idx];
      if (next !== undefined && next !== value) onChange(next);
      dispatch({ type: "close" });
    },
    [allOptions, onChange, value]
  );

  // ---- Outside click closes -------------------------------------------
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const target = e.target;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      dispatch({ type: "close" });
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // ---- Keep highlighted option scrolled into view ----------------------
  useEffect(() => {
    if (normalizedHighlighted < 0) return;
    optionRefs.current[normalizedHighlighted]?.scrollIntoView({ block: "nearest" });
  }, [normalizedHighlighted]);

  // ---- Typeahead buffer timeout ---------------------------------------
  const clearTypeahead = useCallback(() => {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = null;
    dispatch({ type: "resetTypeahead" });
  }, []);

  const typeahead = useCallback(
    (char) => {
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT);
      dispatch({ type: "typeahead", char });
    },
    [clearTypeahead]
  );

  // ---- Trigger keyboard ------------------------------------------------
  const onTriggerKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (open) {
            if (normalizedHighlighted >= 0) selectIndex(normalizedHighlighted);
          } else {
            openList(false);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (open) dispatch({ type: "move", key: "ArrowDown" });
          else openList(false);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (open) dispatch({ type: "move", key: "ArrowUp" });
          else openList(true);
          break;
        case "Home":
          e.preventDefault();
          if (!open) openList(false);
          dispatch({ type: "move", key: "Home" });
          break;
        case "End":
          e.preventDefault();
          if (!open) openList(true);
          dispatch({ type: "move", key: "End" });
          break;
        case "Escape":
          e.preventDefault();
          if (open) closeList();
          break;
        default:
          // Typeahead: single printable character.
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (open) {
              typeahead(e.key);
            } else {
              // Open + match atomically so the open action can't clobber the
              // typeahead result by resetting the highlight to the selection.
              dispatch({ type: "openAndTypeahead", char: e.key, selectedIndex });
              if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
              typeaheadTimer.current = setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT);
            }
          }
          break;
      }
    },
    [open, normalizedHighlighted, selectedIndex, selectIndex, openList, closeList, typeahead, clearTypeahead]
  );

  // ---- Option pointer handlers -----------------------------------------
  const onOptionPointerDown = useCallback(
    (idx) => (e) => {
      // pointerdown (not click) so it fires before the outside-click close.
      e.preventDefault();
      selectIndex(idx);
    },
    [selectIndex]
  );

  const onOptionMouseEnter = useCallback(
    (idx) => () => dispatch({ type: "setHighlight", index: idx }),
    []
  );

  // ---- Trigger display -------------------------------------------------
  const displayValue = triggerLabel(value, placeholder);
  const isPlaceholder = !value;

  const optionId = (idx) => `${panelId}-opt-${idx}`;

  return (
    <div className={`area-select${open ? " area-select--open" : ""}`}>
      <label id={labelId} className="area-select__label">
        {label}
      </label>

      {/* Native select — used only on coarse pointers (touch). */}
      <select
        className="area-select__native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-labelledby={labelId}
      >
        <option value="">{placeholder}</option>
        {options.map((town) => (
          <option key={town} value={town}>
            {town}
          </option>
        ))}
        <option value={OTHER_VALUE}>Other</option>
      </select>

      {/* Custom trigger — used only on fine pointers (mouse). */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="area-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={labelId}
        aria-activedescendant={
          normalizedHighlighted >= 0
            ? optionId(normalizedHighlighted)
            : undefined
        }
        onClick={() => (open ? dispatch({ type: "close" }) : openList(false))}
        onKeyDown={onTriggerKeyDown}
      >
        <span
          className={`area-select__value${
            isPlaceholder ? " area-select__value--placeholder" : ""
          }`}
          title={isPlaceholder ? undefined : displayValue}
        >
          {displayValue}
        </span>
        <ChevronDown className="area-select__chevron" size={16} aria-hidden="true" />
      </button>

      {/* Panel — fine pointers only; animated via framer-motion. */}
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={panelRef}
            id={panelId}
            role="listbox"
            aria-label={label}
            aria-labelledby={labelId}
            tabIndex={-1}
            className="area-select__panel"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.14, ease: "easeOut" }
            }
            style={{ transformOrigin: "top left" }}
          >
            {allOptions.map((opt, idx) => {
              const selected = idx === selectedIndex;
              const isHighlight = idx === normalizedHighlighted;
              return (
                <li
                  key={opt}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={selected}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  className={`area-select__option${
                    selected ? " area-select__option--selected" : ""
                  }${isHighlight ? " area-select__option--highlight" : ""}`}
                  onMouseDown={onOptionPointerDown(idx)}
                  onMouseEnter={onOptionMouseEnter(idx)}
                >
                  <span className="area-select__option-text" title={optionLabel(opt)}>
                    {optionLabel(opt)}
                  </span>
                  {selected && (
                    <Check className="area-select__check" size={16} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Inline SVGs (no new dependencies) --------------------------------
function ChevronDown({ size, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Check({ size, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
