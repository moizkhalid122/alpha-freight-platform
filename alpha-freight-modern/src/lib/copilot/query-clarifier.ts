import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

export type ClarificationTopic =
  | "rpm"
  | "insurance"
  | "load"
  | "payout"
  | "tracking"
  | "signup";

type ClarificationSpec = {
  topic: ClarificationTopic;
  test: (text: string) => boolean;
  title: string;
  intro: string;
  options: string[];
};

const SPECS: ClarificationSpec[] = [
  {
    topic: "rpm",
    test: (t) => /^(rpm|rate per mile|revenue per mile)\.?$/i.test(t),
    title: "RPM",
    intro: "**RPM** can mean a few different things in UK haulage. Which did you mean?",
    options: [
      "What is RPM?",
      "How do I calculate RPM?",
      "What is a good RPM in the UK?",
    ],
  },
  {
    topic: "insurance",
    test: (t) => /^(insurance|insur|cover|coverage)\.?$/i.test(t),
    title: "Insurance",
    intro: "Insurance covers several areas in UK freight. Which one are you asking about?",
    options: [
      "What carrier insurance do I need?",
      "What is Goods in Transit (GIT) insurance?",
      "What is Public Liability insurance?",
      "How does Alpha Freight vet carrier insurance?",
    ],
  },
  {
    topic: "load",
    test: (t) => /^(load|loads|freight)\.?$/i.test(t),
    title: "Loads",
    intro: "Happy to help with loads — what would you like to do?",
    options: [
      "How do I find loads in the UK?",
      "How do I post a load as a supplier?",
      "How do I book my first load as a carrier?",
    ],
  },
  {
    topic: "payout",
    test: (t) => /^(payout|payouts|payment|pay|wallet)\.?$/i.test(t),
    title: "Payments",
    intro: "Payments work differently for carriers and suppliers. Which applies to you?",
    options: [
      "How do carrier payouts work on Alpha Freight?",
      "What is the 7-day payout guarantee?",
      "Pay Instant vs Pay Later for suppliers",
    ],
  },
  {
    topic: "tracking",
    test: (t) => /^(tracking|track|gps)\.?$/i.test(t),
    title: "Tracking",
    intro: "Tracking on Alpha Freight — what do you need?",
    options: [
      "How does live load tracking work?",
      "How do I share tracking with my customer?",
      "Track a shipment I booked",
    ],
  },
  {
    topic: "signup",
    test: (t) => /^(sign up|signup|register|join|account)\.?$/i.test(t),
    title: "Sign up",
    intro: "Getting started on Alpha Freight — which path fits you?",
    options: [
      "How do I sign up as a carrier?",
      "How do I sign up as a supplier?",
      "Is Alpha Freight free to use?",
    ],
  },
];

function recentTopicDiscussed(history: ChatHistoryItem[], topic: ClarificationTopic): boolean {
  const lastAssistant = [...history]
    .reverse()
    .find((h) => h.role === "assistant")?.content?.toLowerCase();
  if (!lastAssistant) return false;

  const topicWords: Record<ClarificationTopic, RegExp> = {
    rpm: /\brpm|revenue per mile|rate per mile|profit per mile/i,
    insurance: /\binsurance|git|goods in transit|public liability|cover/i,
    load: /\bload|freight|haul|book|bid/i,
    payout: /\bpayout|wallet|payment|7.day|seven day/i,
    tracking: /\btrack|gps|live|shipment/i,
    signup: /\bsign up|register|account|carrier|supplier/i,
  };

  return topicWords[topic].test(lastAssistant);
}

export function detectClarificationNeeded(
  message: string,
  history: ChatHistoryItem[] = []
): ClarificationSpec | null {
  const text = message.trim().replace(/[!?.]+$/g, "").trim();
  if (text.length > 40) return null;

  for (const spec of SPECS) {
    if (spec.test(text) && !recentTopicDiscussed(history, spec.topic)) {
      return spec;
    }
  }

  return null;
}

export function buildClarificationReply(
  spec: ClarificationSpec,
  assistantName = "Alpha Freight AI"
): { message: string; structuredMessage: StructuredAssistantReply } {
  const bullets = spec.options.map((o) => `• ${o}`).join("\n");
  const body = `${spec.intro}\n\n${bullets}`;

  return {
    message: body,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "plain",
      assistantName,
      modeLabel: assistantName,
      knowledgeSource: "clarification",
      confidence: 98,
      userIntent: spec.topic,
      title: "",
      shortExplanation: body,
      keyPoints: spec.options,
      recommendation: "",
      nextStep: "Tap one of the options below — or type your question in your own words.",
      suggestedQuestions: spec.options.slice(0, 3),
      quickActions: [],
      rawText: body,
    },
  };
}

export function wantsRpmCalculatorForm(message: string): boolean {
  const lower = message.toLowerCase();
  if (!/\b(calculate|calc|work out|figure out|kitna|compute)\b/i.test(lower)) return false;
  if (!/\b(rpm|profit|margin|rate per mile)\b/i.test(lower)) return false;
  if (/£\s*\d|\d+\s*(mile|miles|mi\b)/i.test(message)) return false;
  return true;
}

export function buildRpmCalculatorToolReply(assistantName = "Alpha Freight AI"): {
  message: string;
  structuredMessage: StructuredAssistantReply;
} {
  const body = `Enter your **load payment** and **loaded miles** below — I'll calculate RPM, fuel cost, and estimated profit using typical UK haulage assumptions.`;

  return {
    message: body,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "plain",
      assistantName,
      modeLabel: assistantName,
      knowledgeSource: "tool",
      confidence: 99,
      title: "",
      shortExplanation: body,
      keyPoints: [],
      recommendation: "",
      nextStep: "",
      inlineTool: "rpm_calculator",
      suggestedQuestions: [
        "What is a good RPM in the UK?",
        "How do I find higher-paying loads?",
        "How does fuel affect my profit?",
      ],
      quickActions: [
        {
          label: "Open full margin calculator",
          href: "/tools/carrier-margin",
          action: "Open carrier margin calculator",
          variant: "secondary",
        },
      ],
      rawText: body,
    },
  };
}
