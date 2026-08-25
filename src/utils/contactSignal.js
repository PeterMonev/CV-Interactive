// A one-way channel from the contact form to the 3D scene behind it.
//
// The orb is mounted lazily and sits in a different branch of the tree from the
// form, so passing this as props would mean threading state through Contact,
// the lazy wrapper and the Suspense boundary for the sake of two numbers. A
// module-level subscription keeps both sides unaware of each other: the form
// reports what it knows, the scene reacts if it happens to be mounted.
//
// Deliberately not a window CustomEvent — this stays inside the bundle, cannot
// collide with anything else on the page, and is directly testable.

let state = { charge: 0, status: "idle" };
const subscribers = new Set();

export function setContactState(patch) {
  const next = { ...state, ...patch };
  if (next.charge === state.charge && next.status === state.status) return;
  state = next;
  subscribers.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      /* a broken subscriber must not take the form down with it */
    }
  });
}

export function getContactState() {
  return state;
}

export function onContactState(fn) {
  subscribers.add(fn);
  fn(state);
  return () => subscribers.delete(fn);
}

// How full the message is, as one number the scene can animate toward. Weighted
// by effort rather than by field count: the message body is the part that takes
// work, so it carries most of the charge.
export function chargeOf({ name = "", email = "", message = "" }) {
  const hasName = name.trim().length > 1 ? 1 : 0;
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 1 : 0;
  const body = Math.min(1, message.trim().length / 60);
  return Math.min(1, hasName * 0.22 + hasEmail * 0.3 + body * 0.48);
}
