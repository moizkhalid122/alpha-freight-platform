import type { ChatHistoryItem, ConciergeAgentTool } from "@/lib/chat-types";
import {
  findConciergePagesForQuery,
  getConciergePage,
  type ConciergePublicPage,
} from "@/lib/concierge/concierge-site-map";

export const CONCIERGE_OPEN_INTENT =
  /\b(open|show|go to|take me|navigate|kholo|dikhao|dekhao|le jao|chalo|page|laao|lao|jao|bhejo|laga do)\b/i;

const OPEN_INTENT = CONCIERGE_OPEN_INTENT;

const SIGNUP_ACTION =
  /\b(signup|sign up|sign-up|register|registration|join alpha|create account|account banao|signup page|sign me up|register me)\b/i;

const CARRIER_IDENTITY =
  /\b(i'?m a carrier|i am a carrier|carrier hun|main carrier hun|carrier hoon|driver hun|haulier hun)\b/i;

const SUPPLIER_IDENTITY =
  /\b(i'?m a supplier|i am a supplier|supplier hun|main supplier hun|shipper hun)\b/i;

function isInformationalQuery(message: string): boolean {
  return /\b(what is|what are|tell me about|explain|how does|how do|information|info about|about the|who are|why|difference between)\b/i.test(
    message,
  );
}

/** User clearly asked to open a specific public page (not signup). */
export function resolveExplicitPageRequest(message: string): ConciergePublicPage | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const hasOpenIntent = OPEN_INTENT.test(trimmed) || lower.includes("page");

  const directAliases: Array<{ pattern: RegExp; path: string }> = [
    { pattern: /\b(pricing page|pricing|price page|fees page|kitna|costs?)\b/i, path: "/pricing" },
    { pattern: /\b(contact page|contact us|get in touch)\b/i, path: "/contact" },
    { pattern: /\b(find loads|find load|load board|available loads)\b/i, path: "/find-loads" },
    { pattern: /\b(about page|about us|about alpha)\b/i, path: "/about" },
    { pattern: /\b(support page|help centre|help center)\b/i, path: "/support" },
    { pattern: /\b(tools page|calculators|freight tools)\b/i, path: "/tools" },
    { pattern: /\b(margin calculator|margin calc|rpm calc)\b/i, path: "/tools/carrier-margin" },
    { pattern: /\b(fuel surcharge|fuel calc)\b/i, path: "/tools/fuel-surcharge" },
    { pattern: /\b(freight quote|get a quote)\b/i, path: "/tools/freight-quote" },
    { pattern: /\b(carrier info|carrier information)\b/i, path: "/carrier-information" },
    { pattern: /\b(supplier info|supplier information)\b/i, path: "/supplier-information" },
    { pattern: /\b(directory|carrier directory)\b/i, path: "/directory" },
    { pattern: /\b(solution page|how it works)\b/i, path: "/solution" },
    { pattern: /\b(ai chat|alpha ai)\b/i, path: "/ai" },
    { pattern: /\b(login page|sign in|log in)\b/i, path: "/auth/login" },
  ];

  for (const alias of directAliases) {
    if (alias.pattern.test(trimmed)) {
      if (hasOpenIntent || lower.includes("page")) {
        return getConciergePage(alias.path);
      }
    }
  }

  if (hasOpenIntent) {
    const matched = findConciergePagesForQuery(lower, 1)[0];
    if (matched && !matched.path.includes("/auth/signup")) return matched;
  }

  return null;
}

/** Signup only when the user clearly wants to register — not from casual "carrier" talk or info questions. */
export function resolveExplicitSignupRole(
  message: string,
  history: ChatHistoryItem[] = [],
): "carrier" | "supplier" | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (
    isInformationalQuery(trimmed) &&
    !/\b(open|take me|go to|sign me up|register me|signup kholo)\b/i.test(trimmed)
  ) {
    return null;
  }

  const hasSignupAction =
    SIGNUP_ACTION.test(trimmed) ||
    /\b(open signup|take me to signup|signup kholo|register karo)\b/i.test(trimmed);

  const actionInMessage =
    /\b(open|take me|go to|want to sign|need to sign|ready to sign|sign me up|register me|let'?s sign|start signup|join|sign up|signup|register)\b/i.test(
      trimmed,
    );

  if (hasSignupAction) {
    if (/\bsupplier\b/i.test(trimmed)) return "supplier";
    if (/\bcarrier\b/i.test(trimmed)) return "carrier";
    return null;
  }

  if (CARRIER_IDENTITY.test(trimmed) && actionInMessage) return "carrier";
  if (SUPPLIER_IDENTITY.test(trimmed) && actionInMessage) return "supplier";

  if (actionInMessage) {
    if (/\bcarrier\b/i.test(trimmed) && /\b(signup|register|join|account)\b/i.test(trimmed)) {
      return "carrier";
    }
    if (/\bsupplier\b/i.test(trimmed) && /\b(signup|register|join|account|post)\b/i.test(trimmed)) {
      return "supplier";
    }
  }

  const recentUser = history
    .slice(-2)
    .filter((h) => h.role === "user")
    .map((h) => h.content)
    .join(" ");
  const combined = `${recentUser} ${trimmed}`.toLowerCase();
  if (
    CARRIER_IDENTITY.test(combined) &&
    /\b(yes|yeah|yep|sure|okay|ok|please|go ahead|open|signup|register|join)\b/i.test(trimmed)
  ) {
    return "carrier";
  }
  if (
    SUPPLIER_IDENTITY.test(combined) &&
    /\b(yes|yeah|yep|sure|okay|ok|please|go ahead|open|signup|register|join)\b/i.test(trimmed)
  ) {
    return "supplier";
  }

  return null;
}

export function userRequestedSignup(message: string, history: ChatHistoryItem[] = []): boolean {
  return resolveExplicitSignupRole(message, history) !== null;
}

/** True when speech should trigger smart navigation (no "open page" required). */
export function hasClearNavigationIntent(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (resolveExplicitPageRequest(trimmed)) return true;
  if (userRequestedSignup(trimmed)) return true;
  if (OPEN_INTENT.test(trimmed)) return true;
  if (/\b(find load|find loads|available loads|load board|loads dhundo)\b/i.test(lower)) return true;
  if (/\b(pricing|how much|fees|cost|kitna|price)\b/i.test(lower)) return true;
  if (/\b(contact|support|help|get in touch|human|insaan)\b/i.test(lower)) return true;
  return false;
}

function isSignupTool(tool: ConciergeAgentTool): boolean {
  if (tool.type === "navigate") return tool.path.includes("/auth/signup");
  if (tool.type === "fill_field") {
    return tool.form === "signup" || Boolean(tool.path?.includes("/auth/signup"));
  }
  return false;
}

/** Stop unwanted redirects — especially on connect before the user speaks. */
export function guardAgentTools(
  tools: ConciergeAgentTool[] | undefined,
  userText: string,
  options?: { pagePath?: string; history?: ChatHistoryItem[] },
): ConciergeAgentTool[] {
  if (!tools?.length) return [];

  const trimmed = userText.trim();
  const pagePath = options?.pagePath || "/";
  const history = options?.history || [];
  const onSignupPage = pagePath.includes("/auth/signup");
  const signupRole = resolveExplicitSignupRole(trimmed, history);

  if (!trimmed) {
    return tools.filter((t) => {
      if (t.type === "navigate" || t.type === "click" || t.type === "highlight") return false;
      if (isSignupTool(t)) return false;
      return true;
    });
  }

  const explicit = resolveExplicitPageRequest(userText);
  const wantsSignup = signupRole !== null;

  if (explicit && !wantsSignup) {
    const wronglySignup = tools.some(
      (t) =>
        (t.type === "navigate" || t.type === "fill_field") &&
        t.path.includes("/auth/signup"),
    );
    if (wronglySignup) {
      return [{ type: "navigate", path: explicit.path, label: explicit.title }];
    }
  }

  if (!wantsSignup) {
    return tools.filter((t) => {
      if (isSignupTool(t)) return onSignupPage;
      return true;
    });
  }

  return tools;
}
