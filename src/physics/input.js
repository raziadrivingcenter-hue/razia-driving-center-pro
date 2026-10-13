// =============================================================================
// Keyboard input manager — tracks held keys, fires callbacks.
// Desktop only. No touch.
// =============================================================================

const TRACKED = [
  "arrowup", "arrowdown", "arrowleft", "arrowright",
  "w", "a", "s", "d",
];

export function createInputManager() {
  const held = new Set();

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (TRACKED.includes(k)) {
      e.preventDefault();
      held.add(k);
    }
  }

  function onKeyUp(e) {
    held.delete(e.key.toLowerCase());
  }

  function onBlur() {
    held.clear();
  }

  function start() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
  }

  function stop() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    held.clear();
  }

  // Returns { throttle: -1..1, steer: -1..1 }
  function getInput() {
    let throttle = 0;
    let steer = 0;
    if (held.has("arrowup") || held.has("w")) throttle += 1;
    if (held.has("arrowdown") || held.has("s")) throttle -= 1;
    if (held.has("arrowleft") || held.has("a")) steer -= 1;
    if (held.has("arrowright") || held.has("d")) steer += 1;
    return { throttle, steer };
  }

  function clear() {
    held.clear();
  }

  return { start, stop, getInput, clear };
}
