import { useId, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Banknote } from "lucide-react";
import easypaisaLogo from "../../assets/easypaisa.svg";
import debitCardLogo from "../../assets/debitcard.svg";
import jazzcashLogo from "../../assets/jazzcash.png";
import "./PaymentMethodSelect.css";

// Online payment is not live yet, so those methods stay in the list but are
// disabled and labelled "Coming Soon". Payment On Arrival is the only method
// that can be chosen today, and it is the default.
const PAYMENT_METHODS = [
  { id: "payment_on_arrival", label: "Payment On Arrival", available: true },
  { id: "easypaisa", label: "EasyPaisa", logo: easypaisaLogo, available: false },
  { id: "debit_card", label: "Debit Card", logo: debitCardLogo, available: false },
  { id: "jazzcash", label: "JazzCash", logo: jazzcashLogo, available: false },
];

const COMING_SOON = "Coming Soon";

// Indexes of the methods that can actually be chosen — keyboard navigation
// and selection both skip the disabled rows.
const SELECTABLE = PAYMENT_METHODS.map((m, i) => (m.available ? i : -1)).filter(
  (i) => i >= 0
);

function MethodLogo({ method }) {
  if (method.logo) {
    return <img src={method.logo} alt="" className="pm-select__logo" />;
  }
  return (
    <span className="pm-select__logo pm-select__logo--cash">
      <Banknote size={13} aria-hidden="true" />
    </span>
  );
}

/**
 * Payment method dropdown, styled after AreaSelect so the two dropdowns on the
 * booking flow read as one control. Payment methods that are not live yet are
 * rendered disabled with a red "Coming Soon" note instead of a check.
 *
 * On touch devices (@media pointer: coarse) a native <select> is shown instead;
 * both write to the same value/onChange.
 */
export default function PaymentMethodSelect({ value, onChange }) {
  const id = useId();
  const labelId = `${id}-label`;
  const panelId = `${id}-panel`;

  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);
  const shouldReduceMotion = useReducedMotion();

  const selectedIndex = PAYMENT_METHODS.findIndex((m) => m.id === value);
  const selected = PAYMENT_METHODS[selectedIndex] ?? null;

  const closeList = useCallback(() => {
    setOpen(false);
    setHighlighted(-1);
    triggerRef.current?.focus();
  }, []);

  const openList = useCallback(() => {
    setOpen(true);
    setHighlighted(selectedIndex >= 0 ? selectedIndex : SELECTABLE[0]);
  }, [selectedIndex]);

  const selectIndex = useCallback(
    (idx) => {
      const method = PAYMENT_METHODS[idx];
      if (!method?.available) return;
      if (method.id !== value) onChange(method.id);
      closeList();
    },
    [value, onChange, closeList]
  );

  // Move the highlight to the next selectable row, wrapping at both ends.
  // Starting from a disabled row (which the pointer can hover) still lands on
  // the next selectable one rather than jumping back to the top.
  const moveHighlight = useCallback(
    (step) => {
      if (SELECTABLE.length === 0) return;
      const from = highlighted;
      let next;
      if (step > 0) {
        next = SELECTABLE.find((i) => i > from) ?? SELECTABLE[0];
      } else {
        next =
          [...SELECTABLE].reverse().find((i) => i < from) ??
          SELECTABLE[SELECTABLE.length - 1];
      }
      setHighlighted(next);
    },
    [highlighted]
  );

  // Keep the highlighted row in view.
  useEffect(() => {
    if (highlighted < 0) return;
    optionRefs.current[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // Outside click closes.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const inside =
        triggerRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target);
      if (inside) return;
      setOpen(false);
      setHighlighted(-1);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onTriggerKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (open) selectIndex(highlighted >= 0 ? highlighted : selectedIndex);
          else openList();
          break;
        case "ArrowDown":
          e.preventDefault();
          if (open) moveHighlight(1);
          else openList();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (open) moveHighlight(-1);
          else openList();
          break;
        case "Escape":
          e.preventDefault();
          if (open) closeList();
          break;
        default:
          break;
      }
    },
    [open, highlighted, selectedIndex, selectIndex, openList, closeList, moveHighlight]
  );

  const optionId = (idx) => `${panelId}-opt-${idx}`;

  return (
    <div
      className={`pm-select${open ? " pm-select--open" : ""}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setHighlighted(-1);
        }
      }}
    >
      <label id={labelId} className="pm-select__label">
        Payment Method
      </label>

      {/* Native select — touch devices only. */}
      <select
        className="pm-select__native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-labelledby={labelId}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.id} value={m.id} disabled={!m.available}>
            {m.label}
            {m.available ? "" : ` — ${COMING_SOON}`}
          </option>
        ))}
      </select>

      {/* Custom trigger — fine pointers only. */}
      <button
        ref={triggerRef}
        type="button"
        className="pm-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={labelId}
        aria-activedescendant={
          highlighted >= 0 ? optionId(highlighted) : undefined
        }
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="pm-select__trigger-inner">
          {selected && <MethodLogo method={selected} />}
          <span className="pm-select__value">{selected?.label ?? ""}</span>
        </span>
        <ChevronDown className="pm-select__chevron" size={16} aria-hidden="true" />
      </button>

      {/* Panel — fine pointers only. motion.ul is unsafe under React 19, so the
          animation lives on a motion.div wrapping a plain <ul>. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="pm-select__panel-wrap"
            initial={{ scale: 0.96, y: -4 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -4 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.14, ease: "easeOut" }
            }
            style={{ transformOrigin: "top left" }}
          >
            <ul
              ref={panelRef}
              id={panelId}
              role="listbox"
              aria-labelledby={labelId}
              tabIndex={-1}
              className="pm-select__panel"
            >
              {PAYMENT_METHODS.map((method, idx) => {
                const isSelected = idx === selectedIndex;
                const isHighlight = idx === highlighted;
                return (
                  <li
                    key={method.id}
                    id={optionId(idx)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={!method.available}
                    ref={(el) => {
                      optionRefs.current[idx] = el;
                    }}
                    className={`pm-select__option${isSelected ? " pm-select__option--selected" : ""}${isHighlight ? " pm-select__option--highlight" : ""}${!method.available ? " pm-select__option--disabled" : ""}`}
                    onMouseDown={(e) => {
                      // pointerdown-style, so it fires before the outside click.
                      e.preventDefault();
                      if (method.available) selectIndex(idx);
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    <span className="pm-select__option-inner">
                      <MethodLogo method={method} />
                      <span className="pm-select__option-text">
                        {method.label}
                      </span>
                    </span>
                    {method.available ? (
                      isSelected && (
                        <Check
                          className="pm-select__check"
                          size={16}
                          aria-hidden="true"
                        />
                      )
                    ) : (
                      <span className="pm-select__badge">{COMING_SOON}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
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
