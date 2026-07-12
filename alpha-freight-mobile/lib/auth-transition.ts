type Listener = () => void;

let message: string | null = null;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getAuthTransitionMessage() {
  return message;
}

export function subscribeAuthTransition(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startAuthTransition(nextMessage: string) {
  message = nextMessage;
  notify();
}

export function updateAuthTransition(nextMessage: string) {
  if (!message) return;
  message = nextMessage;
  notify();
}

export function endAuthTransition() {
  if (!message) return;
  message = null;
  notify();
}
