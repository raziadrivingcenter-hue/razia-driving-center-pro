// =============================================================================
// Customer session helper — lightweight localStorage-backed "signed up" state.
// No backend auth: the website is public (anon-key only). Signup just records
// the customer's name + contact so the dashboard can greet them and, later,
// show their progress. Everything lives in localStorage on the device.
// =============================================================================

const KEY = "rdc_customer";

export function getCustomer() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCustomer(data) {
  const record = {
    ...data,
    signedUpAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(record));
  return record;
}

export function clearCustomer() {
  localStorage.removeItem(KEY);
}

export function isSignedUp() {
  return getCustomer() != null;
}
