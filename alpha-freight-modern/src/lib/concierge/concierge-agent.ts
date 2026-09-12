import type { ChatHistoryItem, ConciergeAgentTool } from "@/lib/chat-types";
import type { DetectedIntent } from "@/lib/copilot/intent-detector";
import { findConciergePagesForQuery } from "@/lib/concierge/concierge-site-map";
import {
  buildOnboardingInstantActions,
  type ConciergeOnboardingContext,
} from "@/lib/concierge/concierge-onboarding";
import { buildPortalInstantActions } from "@/lib/concierge/concierge-portal";
import {
  CONCIERGE_OPEN_INTENT,
  resolveExplicitPageRequest,
  resolveExplicitSignupRole,
  userRequestedSignup,
} from "@/lib/concierge/concierge-tool-guard";

function conversationBlob(message: string, history: ChatHistoryItem[]): string {
  return [...history.map((h) => h.content), message].join("\n");
}

function normalizePersonName(raw: string): string | null {
  const name = raw
    .trim()
    .replace(/\s+(and|email|from|se|ka|ki|hai|is|the)\b.*$/i, "")
    .trim();
  if (name.length < 2 || name.length > 60) return null;
  if (/^(good|great|yes|no|ok|okay|thanks|thank you)$/i.test(name)) return null;
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function extractNameFromText(text: string): string | null {
  const namePatterns = [
    /\b(?:but|actually|no)\s*,?\s*(?:my\s+)?(?:full\s+)?name\s+is\s+([A-Za-z][A-Za-z\s'-]{1,48})/i,
    /\b(?:correct|change|update)\s+(?:my\s+)?(?:full\s+)?name\s+(?:to\s+)?([A-Za-z][A-Za-z\s'-]{1,48})/i,
    /\b(?:put|enter|fill|type|set|add)\s+(?:my\s+)?(?:full\s+)?name\s*(?:as|is|to|:)?\s*([A-Za-z][A-Za-z\s'-]{1,48})/i,
    /\b(?:my name is|i am|i'm|call me|this is|mera naam|naam)\s+([A-Za-z][A-Za-z\s'-]{1,48})/i,
    /\b(?:full name|name)\s*(?:is|:)\s*([A-Za-z][A-Za-z\s'-]{1,48})/i,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const normalized = normalizePersonName(match[1]);
      if (normalized) return normalized;
    }
  }
  return null;
}

export function extractSignupFields(message: string, history: ChatHistoryItem[]): Record<string, string> {
  const isCorrection = /\b(but|actually|correct|wrong|change|not|update|naam)\b/i.test(message);
  const fields: Record<string, string> = {};

  const emailPatterns = [
    /\b(?:put|enter|fill|type|set|add)\s+(?:my\s+)?(?:email|e-mail)\s*(?:as|is|to|:)?\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i,
    /\b(?:email|e-mail)\s*(?:is|:)\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i,
  ];
  const blob = isCorrection ? message : conversationBlob(message, history);

  for (const pattern of emailPatterns) {
    const match = blob.match(pattern);
    if (match?.[1]) {
      fields.email = match[1].toLowerCase();
      break;
    }
  }

  if (!fields.email) {
    const emailMatch = blob.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    if (emailMatch) fields.email = emailMatch[0].toLowerCase();
  }

  const nameFromMessage = extractNameFromText(message);
  const nameFromBlob = extractNameFromText(blob);
  const fullName = nameFromMessage || nameFromBlob;
  if (fullName) fields.fullName = fullName;

  const refMatch = blob.match(/\b(AF-(?:CAR|SUP)-[A-Z0-9]{4,12})\b/i);
  if (refMatch) fields.referralCode = refMatch[1].toUpperCase();

  return fields;
}

export function extractContactFields(message: string, history: ChatHistoryItem[]): Record<string, string> {
  const blob = conversationBlob(message, history);
  const fields: Record<string, string> = {};
  const signupFields = extractSignupFields(message, history);
  if (signupFields.fullName) fields.name = signupFields.fullName;
  if (signupFields.email) fields.email = signupFields.email;

  const phoneMatch = blob.match(/(?:\+44|0)\d[\d\s]{8,14}/);
  if (phoneMatch) fields.phone = phoneMatch[0].replace(/\s+/g, " ");

  if (/\bcarrier registration\b/i.test(blob)) fields.subject = "carrier";
  else if (/\bsupplier registration\b/i.test(blob)) fields.subject = "supplier";
  else if (/\b(quote|pricing)\b/i.test(blob)) fields.subject = "quote";
  else if (/\b(partnership|partner)\b/i.test(blob)) fields.subject = "partnership";
  else if (/\b(support|technical|bug)\b/i.test(blob)) fields.subject = "support";

  const msgMatch = blob.match(/\b(?:message|saying|write|note)\s*(?:is|:)?\s*["']?([^"'\n]{8,240})/i);
  if (msgMatch?.[1]) fields.message = msgMatch[1].trim();

  return fields;
}

export function wantsCarrierIntent(lower: string): boolean {
  return (
    /\b(i'?m a carrier|main carrier|carrier hun|carrier hoon|driver hun|haulier|hgv driver|truck driver|gaadi wala)\b/i.test(
      lower,
    ) ||
    /\b(join(ing)?\s+(alpha|as)\s+(a\s+)?carrier|become\s+a\s+carrier|register\s+as\s+carrier|carrier\s+(sign[\s-]?up|signup|registration|onboarding|account))\b/i.test(
      lower,
    ) ||
    (/\b(carrier|driver|haulier|hgv|truck|lorry)\b/i.test(lower) &&
      /\b(sign|signup|register|join|account|apply|start|guide|process|how)\b/i.test(lower))
  );
}

export function wantsSupplierIntent(lower: string): boolean {
  return (
    /\b(i'?m a supplier|main supplier|supplier hun|shipper|load post karna|post loads)\b/i.test(lower) ||
    /\b(join(ing)?\s+(alpha|as)\s+(a\s+)?supplier|become\s+a\s+supplier|supplier\s+(sign[\s-]?up|signup|registration|account))\b/i.test(
      lower,
    ) ||
    (/\b(supplier|shipper|sender)\b/i.test(lower) &&
      /\b(sign|signup|register|join|account|apply|post|load|guide|how)\b/i.test(lower)) ||
    /\bpost a load\b/i.test(lower) ||
    /\bpost load\b/i.test(lower)
  );
}

export function buildConciergeAgentTools(input: {
  message: string;
  reply: string;
  history?: ChatHistoryItem[];
  detectedIntent?: DetectedIntent;
  pagePath?: string;
}): ConciergeAgentTool[] {
  const { message, history = [], detectedIntent } = input;
  const lower = `${history
    .slice(-4)
    .filter((h) => h.role === "user")
    .map((h) => h.content)
    .join(" ")} ${message}`.toLowerCase();
  const tools: ConciergeAgentTool[] = [];
  const fields = extractSignupFields(message, history);

  const explicitPage = resolveExplicitPageRequest(message);
  if (explicitPage && !explicitPage.path.includes("/auth/signup")) {
    if (explicitPage.path === "/contact") {
      const contactFields = extractContactFields(message, history);
      if (Object.keys(contactFields).length > 0) {
        return [{ type: "fill_field", form: "contact", fields: contactFields, path: "/contact" }];
      }
    }
    return [{ type: "navigate", path: explicitPage.path, label: explicitPage.title }];
  }

  const openIntent = CONCIERGE_OPEN_INTENT.test(message) || CONCIERGE_OPEN_INTENT.test(lower);

  const signupRole = resolveExplicitSignupRole(message, history);
  if (signupRole && (openIntent || userRequestedSignup(message, history) || Object.keys(fields).length > 0)) {
    const path = `/auth/signup?role=${signupRole}`;
    if (Object.keys(fields).length > 0) {
      return [{ type: "fill_field", form: "signup", role: signupRole, fields, path }];
    }
    return [{ type: "navigate", path, label: `${signupRole} signup` }];
  }

  if (
    !tools.length &&
    /\b(find load|find loads|available load|loads near|search load|load dhundo|loads dikhao)\b/i.test(lower)
  ) {
    tools.push({ type: "navigate", path: "/find-loads", label: "Find loads" });
  }

  if (
    /\b(contact page|contact us|get in touch|message you|email you|reach out|support|help)\b/i.test(lower)
  ) {
    const contactFields = extractContactFields(message, history);
    if (Object.keys(contactFields).length > 0) {
      tools.push({
        type: "fill_field",
        form: "contact",
        fields: contactFields,
        path: "/contact",
      });
    } else {
      tools.push({ type: "navigate", path: "/contact", label: "Contact" });
    }
  }

  if (
    (openIntent || /\b(pricing|how much|fees|cost|kitna|price)\b/i.test(lower)) &&
    /\b(pricing|rate check|margin calc|fuel surcharge|distance calc|freight quote|how much|fees|cost|kitna|price)\b/i.test(
      lower,
    )
  ) {
    if (/\bmargin|profit|rpm\b/i.test(lower)) {
      tools.push({ type: "navigate", path: "/tools/carrier-margin", label: "Margin calculator" });
    } else if (/\bfuel\b/i.test(lower)) {
      tools.push({ type: "navigate", path: "/tools/fuel-surcharge", label: "Fuel surcharge" });
    } else if (/\bquote|estimate\b/i.test(lower)) {
      tools.push({ type: "navigate", path: "/tools/freight-quote", label: "Freight quote" });
    } else if (/\bdistance|miles\b/i.test(lower)) {
      tools.push({ type: "navigate", path: "/tools/distance", label: "Distance calculator" });
    } else if (!/\b(sign|signup|register)\b/i.test(lower)) {
      tools.push({ type: "navigate", path: "/pricing", label: "Pricing" });
    }
  }

  if (!tools.length && openIntent) {
    const matchedPages = findConciergePagesForQuery(lower, 1);
    const top = matchedPages[0];
    if (top && top.path !== input.pagePath && !top.path.includes("/auth/signup")) {
      tools.push({ type: "navigate", path: top.path, label: top.title });
    }
  }

  if (detectedIntent?.needsHandoff || /\b(human|agent|person|insaan|banday se|call me|phone|support team)\b/i.test(lower)) {
    tools.push({ type: "human_handoff" });
  }

  const clickTools = buildClickTools(message, input.pagePath || "/");
  if (clickTools.length) return clickTools;

  if (
    !tools.length &&
    Object.keys(fields).length > 0 &&
    (input.pagePath?.includes("/auth/signup") || signupRole)
  ) {
    const role =
      signupRole ||
      (input.pagePath?.includes("role=supplier") ? "supplier" : "carrier");
    tools.push({
      type: "fill_field",
      form: "signup",
      role,
      fields,
      path: `/auth/signup?role=${role}`,
    });
  }

  return tools;
}

export function buildSignupFieldFillTools(input: {
  message: string;
  history?: ChatHistoryItem[];
  pagePath?: string;
}): ConciergeAgentTool[] {
  if (!input.pagePath?.startsWith("/auth/signup")) return [];

  const fields = extractSignupFields(input.message, input.history || []);
  if (!Object.keys(fields).length) return [];

  const role = input.pagePath.includes("role=supplier") ? "supplier" : "carrier";
  return [
    {
      type: "fill_field",
      form: "signup",
      role,
      fields,
      path: `/auth/signup?role=${role}`,
    },
  ];
}

export function buildContactFieldFillTools(input: {
  message: string;
  history?: ChatHistoryItem[];
  pagePath?: string;
}): ConciergeAgentTool[] {
  if (input.pagePath !== "/contact") return [];
  const fields = extractContactFields(input.message, input.history || []);
  if (!Object.keys(fields).length) return [];
  return [{ type: "fill_field", form: "contact", fields, path: "/contact" }];
}

export function buildHighlightTools(
  message: string,
  pagePath: string,
  onboardingContext?: ConciergeOnboardingContext | null,
): ConciergeAgentTool[] {
  const lower = message.toLowerCase();
  if (pagePath.startsWith("/onboarding") && onboardingContext) {
    const onboardingTools = buildOnboardingInstantActions(message, onboardingContext);
    if (onboardingTools.length) return onboardingTools;
  }
  if (!pagePath.includes("/auth/signup")) return [];
  if (/\b(full name|name field|naam)\b/i.test(lower)) {
    return [{ type: "highlight", target: "fullName" }];
  }
  if (/\b(email field|email box)\b/i.test(lower)) {
    return [{ type: "highlight", target: "email" }];
  }
  if (/\b(password field|password box)\b/i.test(lower)) {
    return [{ type: "highlight", target: "password" }];
  }
  if (/\b(create account|submit|sign up button|register button|press submit|click submit)\b/i.test(lower)) {
    return [{ type: "click", target: "submit" }];
  }
  return [];
}

export function buildClickTools(message: string, pagePath: string): ConciergeAgentTool[] {
  const lower = message.toLowerCase();
  const wantsClick =
    /\b(click|press|tap|hit|daba|dabao|submit|create account|register now|continue|next step|go ahead|proceed|send|done)\b/i.test(
      lower,
    );
  if (!wantsClick) return [];

  if (pagePath.includes("/auth/signup")) {
    if (/\b(create account|register|submit|sign up)\b/i.test(lower)) {
      return [{ type: "click", target: "submit" }];
    }
  }

  if (pagePath === "/contact") {
    if (/\b(send|submit|message)\b/i.test(lower)) {
      return [{ type: "click", target: "submit" }];
    }
  }

  if (pagePath.startsWith("/onboarding")) {
    if (/\b(next|continue|proceed|go ahead|agla|aage|submit)\b/i.test(lower)) {
      return [{ type: "click", target: "next" }];
    }
  }

  if (pagePath.startsWith("/auth/login")) {
    if (/\b(login|sign in|submit)\b/i.test(lower)) {
      return [{ type: "click", target: "submit" }];
    }
  }

  return [];
}

export function buildShareReferralTool(
  message: string,
  memory?: { userReferralCode?: string | null; role?: string | null },
): ConciergeAgentTool[] {
  if (!/\b(share|refer|referral|invite|mate|friend|whatsapp)\b/i.test(message)) return [];
  const role = memory?.role === "supplier" ? "supplier" : "carrier";
  const code = memory?.userReferralCode?.trim();
  if (!code) return [];
  return [{ type: "share_referral", role, code }];
}

/** Instant client-side actions from speech — form updates + smart navigation. */
export function buildConciergeInstantActions(input: {
  message: string;
  history?: ChatHistoryItem[];
  pagePath?: string;
  memory?: {
    userReferralCode?: string | null;
    role?: string | null;
    onboardingContext?: ConciergeOnboardingContext | null;
  };
}): ConciergeAgentTool[] {
  const history = input.history || [];
  const pagePath = input.pagePath || "/";
  const tools: ConciergeAgentTool[] = [];

  if (pagePath.startsWith("/onboarding") && input.memory?.onboardingContext) {
    const onboardingTools = buildOnboardingInstantActions(
      input.message,
      input.memory.onboardingContext,
    );
    if (onboardingTools.length) return onboardingTools;
  }

  const portalTools = buildPortalInstantActions(input.message, pagePath);
  if (portalTools.length) return portalTools;

  const shareTools = buildShareReferralTool(input.message, input.memory);
  if (shareTools.length) return shareTools;

  const clickTools = buildClickTools(input.message, pagePath);
  if (clickTools.length) return clickTools;

  const highlightTools = buildHighlightTools(input.message, pagePath, input.memory?.onboardingContext);
  if (highlightTools.length) return highlightTools;

  const signupFill = buildSignupFieldFillTools({
    message: input.message,
    history,
    pagePath,
  });
  if (signupFill.length) {
    tools.push(...signupFill);
    return tools;
  }

  const contactFill = buildContactFieldFillTools({
    message: input.message,
    history,
    pagePath,
  });
  if (contactFill.length) {
    tools.push(...contactFill);
    return tools;
  }

  const fields = extractSignupFields(input.message, history);
  if (Object.keys(fields).length > 0 && pagePath.includes("/auth/signup")) {
    const role = pagePath.includes("role=supplier") ? "supplier" : "carrier";
    tools.push({
      type: "fill_field",
      form: "signup",
      role,
      fields,
      path: `/auth/signup?role=${role}`,
    });
    return tools;
  }

  return buildConciergeAgentTools({
    message: input.message,
    reply: "",
    history,
    pagePath,
  });
}
