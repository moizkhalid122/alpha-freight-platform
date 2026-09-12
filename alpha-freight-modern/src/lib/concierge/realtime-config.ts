import type { LanguagePreference } from "@/lib/copilot/language";
import {
  getConciergeRealtimeTranscribeModel,
  isFastRealtimeLatencyMode,
  shouldUseRealtimeVoice,
} from "@/lib/concierge/concierge-cost";
import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import { formatConciergeMemoryForPrompt } from "@/lib/concierge/concierge-session";
import { buildEmotionPromptBlock } from "@/lib/concierge/concierge-emotion";
import { formatKnowledgeForPrompt } from "@/lib/concierge/concierge-knowledge";
import { formatOnboardingContextForPrompt } from "@/lib/concierge/concierge-onboarding";
import { buildPortalGuide } from "@/lib/concierge/concierge-portal";
import {
  buildConciergePageGuide,
  buildConciergeSiteMapPrompt,
} from "@/lib/concierge/concierge-site-map";

const REALTIME_MODEL_FALLBACKS = [
  "gpt-realtime-mini",
  "gpt-realtime",
  "gpt-4o-mini-realtime-preview",
] as const;

export function getRealtimeModel(): string {
  return process.env.OPENAI_REALTIME_MODEL?.trim() || REALTIME_MODEL_FALLBACKS[0];
}

export function getRealtimeModelFallbacks(): string[] {
  const primary = getRealtimeModel();
  return [primary, ...REALTIME_MODEL_FALLBACKS.filter((m) => m !== primary)];
}

export function getRealtimeVoice(): string {
  const voice = process.env.OPENAI_REALTIME_VOICE?.trim() || "marin";
  const allowed = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"];
  return allowed.includes(voice) ? voice : "marin";
}

export function isRealtimeConciergeEnabled(): boolean {
  if (!shouldUseRealtimeVoice()) return false;
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export type RealtimeInstructionOptions = {
  memory?: ConciergeVoiceMemory;
  signupGuide?: boolean;
  greetingOverride?: string | null;
};

function buildSignupPageGuide(role?: string | null): string {
  const isSupplier = role === "supplier";
  return `
SIGNUP PAGE — guide naturally (user is on the form now):
- Name/email may already be filled — don't ask again if you know them.
- Next step: choose a secure password and tap Create Account (never ask password aloud).
- After submit they go straight into Alpha onboarding — same as signing up on the website normally.
- Only mention email verification if signup fails and the form shows a verify-email message.
- ${
    isSupplier
      ? "After onboarding: post their first UK load."
      : "After onboarding: add lorries, then browse and bid on loads."
  }
- One short step at a time — never mention verification links unless the form error says so.`;
}

export function buildRealtimeInstructions(
  language: LanguagePreference = "english",
  pagePath = "/",
  options: RealtimeInstructionOptions = {},
): string {
  const effectiveLang = options.memory?.detectedLanguage || language;
  const lang =
    effectiveLang === "roman_urdu"
      ? "Reply in natural Roman Urdu mixed with English freight terms — warm, like a friendly UK call centre agent who code-switches."
      : effectiveLang === "urdu"
        ? "Reply in Urdu where natural, keeping UK freight terms clear."
        : "Reply in warm British English — like a real person on a phone call, not a script.";

  const memoryBlock = formatConciergeMemoryForPrompt(options.memory || {});
  const knowledgeBlock = formatKnowledgeForPrompt(options.memory?.knowledgeSnippets || []);
  const portalBlock = buildPortalGuide(pagePath);
  const onboardingBlock =
    pagePath.startsWith("/onboarding") || options.memory?.onboardingContext
      ? formatOnboardingContextForPrompt(options.memory?.onboardingContext)
      : "";
  const onSignupPage = pagePath.includes("/auth/signup");
  const signupBlock =
    (onSignupPage && options.memory?.signupStage === "form_filled") || options.signupGuide
      ? buildSignupPageGuide(options.memory?.role)
      : "";
  const greetingHint = options.greetingOverride
    ? `\nFIRST LINE THIS SESSION: Say warmly: "${options.greetingOverride}" — then listen. Do NOT use any tools on this opening line.\n`
    : "";
  const emotionBlock = buildEmotionPromptBlock(options.memory?.userEmotion || "neutral");

  return `You are Alpha — the VIP live voice concierge for Alpha Freight, a UK B2B freight marketplace (suppliers post loads, carriers bid and haul).
${greetingHint}

PERSONALITY — sound like a real human on a phone call (not a bot):
- Warm, relaxed, confident UK tone. Use contractions (I'm, we'll, that's).
- Start naturally — brief pause is good. Open with "Hmm…", "Right…", "Yeah…", "Ah okay…", or "Well…" when thinking.
- Soft human fillers (one per reply max): "uh", "hmm", "well", "let me see", "one sec" — like a real person, not scripted.
- React before acting: "Oh got it —", "Ah lovely —", "Right, so —" then help or navigate.
- Varied openers: "Hey!", "Hi there", "What's up?", "Alright", "Sure thing".
- Never robotic, never the same script twice. NO markdown, lists, URLs, or "As an AI".
- ${lang}
${isFastRealtimeLatencyMode() ? "\nPACE: Still sound human — 1–2 short sentences. On navigation/signup, confirm intent first; then act with one natural line.\n" : "\nPACE: Don't rush. Take a beat before answering — thoughtful humans pause. Usually 2–3 short sentences.\n"}

LISTENING (critical — understand the FULL conversation):
- If the user speaks while you are talking, STOP immediately and listen — they always take priority.
- Hear their WHOLE point before navigating or opening signup — especially on longer explanations.
- The word "carrier" or "supplier" alone is NOT enough — they might be asking about info, pricing, or loads.
- Only open signup when they clearly say they want to register / sign up / join as carrier or supplier.
- If intent is unclear, ask ONE short question: "Are you looking to sign up, or just finding out how it works?"
- Short commands after intent is clear ("yes", "signup", "next", "create account"): act with tools, then one warm confirm line.
- If unsure whether they finished speaking, wait a moment — better late than cutting them off.
- Use remembered name/email/role — never ask again if you already know.
${emotionBlock ? `\n${emotionBlock}\n` : ""}

ON CONNECT (first reply after voice connects — critical):
- Speech ONLY — do NOT call navigate_page, fill_page_form, highlight_element, or click_element.
- Acknowledge the CURRENT PAGE from the context block (e.g. "You're on Pricing — what do you need?").
- Do NOT send them to signup or any other page until they explicitly ask in this session.
- Past memory (role, last visit) is context only — never act on it without fresh user speech.

NAVIGATION (smart — understand first, then move):
- Understand what the user wants from the FULL conversation — then call navigate_page yourself.
- NEVER tell them to say "open the page". NEVER ask "Should I open…?" or "Would you like me to take you…?"
- If they ask about pricing/fees → open /pricing. Find loads → /find-loads. Contact/support → /contact.
- Signup (/auth/signup): ONLY when they clearly want to register — e.g. "sign me up as a carrier", "open carrier signup", "I want to join as supplier".
- "I'm a carrier" or "I'm a supplier" ALONE is NOT enough — ask one short question first: "Want me to open signup for you?"
- NEVER open signup just because they mentioned carriers, asked a question, or you remember their role from last time.
- If they ask what carriers do → explain or open /carrier-information — NOT signup.
- Stay on the page they opened unless they clearly ask to go somewhere else.
- After navigate_page: one short warm sentence — no second navigation, no re-confirm.

FORM FILL (critical on signup/contact pages):
- When the user gives or CORRECTS name/email ("my name is Khalid", "but my full name is…") → call fill_page_form IMMEDIATELY.
- NEVER say a field is updated unless fill_page_form was called in that same turn.
- Corrections overwrite wrong values — always push the latest name/email to the form.

VISUAL GUIDE & AUTO-CLICK (VIP):
- highlight_element pulses a field/button so the user sees where to act.
- click_element PRESSES the button for them — Create Account, Continue, Next, Send, Submit.
- When user says create account / continue / next / submit / send → call click_element (target: submit or next).
- After filling name/email on signup, guide password locally then click_element submit when they say ready.
- NEVER click submit if password field is empty — tell them to type password first.
- On onboarding, click_element target "next" for Continue buttons.

REFERRAL SHARE:
- After signup success or when user says share/referral and you know their code → call share_referral.
- Offer WhatsApp share when celebrating a new account.

ACTIONS:
- Greet once on connect (unless a custom greeting is set above) — no tools on that first greeting.
- navigate_page, fill_page_form, highlight_element, click_element, share_referral are silent website actions.
- Never ask for passwords aloud — they'll type securely on the form.
- If carrier vs supplier is truly unknown, ask ONE short question — then open the page.

${buildConciergeSiteMapPrompt(isFastRealtimeLatencyMode() ? 12 : 28)}

${buildConciergePageGuide(pagePath)}
${portalBlock ? `\n${portalBlock}\n` : ""}${onboardingBlock ? `\n${onboardingBlock}\n` : ""}${memoryBlock ? `\n${memoryBlock}\n` : ""}${knowledgeBlock ? `\n${knowledgeBlock}\n` : ""}${signupBlock}
Keep replies natural — ${isFastRealtimeLatencyMode() ? "1–2 short sentences max unless they explicitly ask for detail." : "usually 2–4 short sentences unless they ask for detail."}`;
}

function buildTranscriptionPrompt(language: LanguagePreference): string {
  const langHint =
    language === "roman_urdu"
      ? "User may speak Roman Urdu, Urdu, or English mixed together."
      : language === "urdu"
        ? "User may speak Urdu or English."
        : "User speaks British English, possibly with accent.";

  return `Live call for Alpha Freight UK freight platform. ${langHint} Transcribe accurately: carrier, supplier, loads, haulage, signup, email, name, referral code, Alpha Freight.`;
}

export function buildRealtimeAudioInput(language: LanguagePreference = "english") {
  const effectiveLang = language;
  const fast = isFastRealtimeLatencyMode();
  return {
    turn_detection: {
      type: "semantic_vad" as const,
      eagerness: (fast ? "auto" : "low") as "high" | "medium" | "low" | "auto",
      create_response: true,
      interrupt_response: true,
    },
    transcription: {
      model: getConciergeRealtimeTranscribeModel(),
      prompt: buildTranscriptionPrompt(effectiveLang),
      ...(effectiveLang === "english" ? { language: "en" } : {}),
    },
  };
}

export function buildRealtimeSessionConfig(options: {
  pagePath?: string;
  language?: LanguagePreference;
  model?: string;
  memory?: ConciergeVoiceMemory;
  signupGuide?: boolean;
}) {
  const language = options.language || "english";
  const pagePath = options.pagePath || "/";

  return {
    type: "realtime",
    model: options.model || getRealtimeModel(),
    instructions: buildRealtimeInstructions(language, pagePath, {
      memory: options.memory,
      signupGuide: options.signupGuide,
    }),
    output_modalities: ["audio"],
    audio: {
      input: buildRealtimeAudioInput(language),
      output: {
        voice: getRealtimeVoice(),
      },
    },
    tools: [
      {
        type: "function",
        name: "navigate_page",
        description:
          "Open a page when the user clearly asks after you understand their intent. Paths: /pricing, /contact, /find-loads, /tools/*, /carrier-information, /supplier-information. Signup paths ONLY if they explicitly want to register (not from casual 'carrier' talk).",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Site path e.g. /pricing or /auth/signup?role=carrier" },
            label: { type: "string" },
          },
          required: ["path"],
        },
      },
      {
        type: "function",
        name: "fill_page_form",
        description:
          "Pre-fill signup or contact form fields. Signup: only when user is registering AND gave name/email — never on connect or from memory alone. Contact: name, email, phone, subject, message.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string" },
            role: { type: "string", enum: ["carrier", "supplier"] },
            fullName: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            subject: { type: "string" },
            message: { type: "string" },
            referralCode: { type: "string" },
          },
          required: ["path"],
        },
      },
      {
        type: "function",
        name: "fill_signup_form",
        description: "Pre-fill carrier/supplier signup (shortcut for fill_page_form).",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["carrier", "supplier"] },
            fullName: { type: "string" },
            email: { type: "string" },
            referralCode: { type: "string" },
          },
          required: ["role"],
        },
      },
      {
        type: "function",
        name: "highlight_element",
        description:
          "Pulse/glow the next field or button. Signup: fullName, email, password, submit. Onboarding: use the field id from ONBOARDING WIZARD (e.g. phone, business_address) or next for Continue button.",
        parameters: {
          type: "object",
          properties: {
            target: { type: "string", description: "Field id, next, submit, or step_<stepId>" },
          },
          required: ["target"],
        },
      },
      {
        type: "function",
        name: "click_element",
        description:
          "Auto-press a button for the user. Targets: submit (Create Account), next/continue (onboarding), send (contact). Only after user confirms or says create account/continue/next/send.",
        parameters: {
          type: "object",
          properties: {
            target: {
              type: "string",
              description: "submit | next | continue | createAccount | send",
            },
          },
          required: ["target"],
        },
      },
      {
        type: "function",
        name: "share_referral",
        description: "Copy referral invite + open WhatsApp share when user wants to share Alpha.",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["carrier", "supplier"] },
            code: { type: "string" },
          },
          required: ["role", "code"],
        },
      },
      {
        type: "function",
        name: "contact_support",
        description: "Escalate to human support.",
        parameters: { type: "object", properties: {} },
      },
    ],
    tool_choice: "auto",
  };
}
