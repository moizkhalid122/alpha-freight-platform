export const CONCIERGE_HIGHLIGHT_ATTR = "data-concierge-highlight-active";
export const CONCIERGE_CLICK_FLASH_ATTR = "data-concierge-click-flash";

export function resolveConciergeTargetSelector(target: string): string {
  const t = target.trim();
  if (t === "submit" || t === "createAccount") {
    return '[data-concierge-field="submit"], button[type="submit"]';
  }
  if (t === "next" || t === "continue") {
    return '[data-concierge-field="next"], [data-concierge-field="submit"], button[type="submit"]';
  }
  if (t.startsWith("step_")) {
    return `[data-concierge-field="${t}"]`;
  }
  return `[data-concierge-field="${t}"]`;
}

export function findConciergeTargetElement(target: string): HTMLElement | null {
  const selector = resolveConciergeTargetSelector(target);
  const el = document.querySelector(selector);
  return el instanceof HTMLElement ? el : null;
}

export function isConciergeClickable(el: HTMLElement): boolean {
  if (el instanceof HTMLButtonElement) return !el.disabled;
  if (el instanceof HTMLInputElement) {
    return !el.disabled && (el.type === "submit" || el.type === "button");
  }
  if (el.getAttribute("role") === "button") {
    return el.getAttribute("aria-disabled") !== "true";
  }
  return true;
}

/** Signup submit needs password typed locally — never auto-click empty password. */
export function canAutoClickSubmitTarget(target: string): boolean {
  const t = target.trim();
  if (t !== "submit" && t !== "createAccount" && t !== "next" && t !== "continue") {
    return true;
  }
  const password = document.querySelector(
    '[data-concierge-field="password"]',
  ) as HTMLInputElement | null;
  if (password && !password.value.trim()) return false;
  return true;
}

export function pulseConciergeTarget(el: HTMLElement, ms = 4500): void {
  document.querySelectorAll(`[${CONCIERGE_HIGHLIGHT_ATTR}]`).forEach((node) => {
    node.removeAttribute(CONCIERGE_HIGHLIGHT_ATTR);
  });
  el.setAttribute(CONCIERGE_HIGHLIGHT_ATTR, "true");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    el.removeAttribute(CONCIERGE_HIGHLIGHT_ATTR);
  }, ms);
}

export function flashConciergeClick(el: HTMLElement): void {
  el.setAttribute(CONCIERGE_CLICK_FLASH_ATTR, "true");
  window.setTimeout(() => {
    el.removeAttribute(CONCIERGE_CLICK_FLASH_ATTR);
  }, 700);
}

export function performConciergeClick(target: string): boolean {
  const el = findConciergeTargetElement(target);
  if (!el || !isConciergeClickable(el)) return false;
  if (!canAutoClickSubmitTarget(target)) return false;

  pulseConciergeTarget(el, 900);
  window.setTimeout(() => {
    if (!isConciergeClickable(el)) return;
    flashConciergeClick(el);
    el.click();
  }, 380);
  return true;
}
