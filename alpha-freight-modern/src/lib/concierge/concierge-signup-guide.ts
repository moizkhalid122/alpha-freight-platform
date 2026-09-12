export const CONCIERGE_SIGNUP_GUIDE_EVENT = "alpha-concierge-signup-guide";

export function dispatchSignupGuideReady(role: "carrier" | "supplier"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CONCIERGE_SIGNUP_GUIDE_EVENT, { detail: { role } }),
  );
}

export function buildSignupGuideHint(role: "carrier" | "supplier"): string {
  if (role === "supplier") {
    return "The signup form was just pre-filled with name and email. In one warm sentence: choose a password, tap Create Account, then continue onboarding — same as normal Alpha signup. Never ask for the password aloud. Do not mention email verification unless the form shows that error.";
  }
  return "The signup form was just pre-filled with name and email. In one warm sentence: choose a password, tap Create Account, then continue carrier onboarding — same as normal Alpha signup. Never ask for the password aloud. Do not mention email verification unless the form shows that error.";
}
