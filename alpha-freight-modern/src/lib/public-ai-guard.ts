const FREIGHT_KEYWORDS =
  /\b(freight|load|loads|haul|haulage|truck|hgv|lorry|carrier|carriers|supplier|suppliers|rpm|diesel|desile|fuel|pod|delivery|logistics|alpha|bid|bids|wallet|payout|motorway|route|routes|backhaul|pallet|shipping|transport|vetting|tracking|signup|sign up|book|earn|profit|margin|rate|rates|quote|uk|manchester|london|birmingham|leeds|glasgow|scotland|wales|calculate|price|cost|lane|lanes|artic|van|reefer|flatbed|curtain|driver|dispatch|compliance|insurance|cmr|tachograph|warehouse|shipper|cargo|tonne|mile|miles|empty|deadhead|smart match|marketplace|7 day|7-day|available|post load|find load)\b/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|salam|assalam|good morning|good afternoon|thanks?|thank you|shukriya|ok|okay|yes|no|help)[.!?,\s]*$/i;

export function isFreightRelatedQuery(message: string): boolean {
  const text = message.trim();
  if (text.length <= 3) return true;
  if (GREETING_PATTERN.test(text)) return true;
  return FREIGHT_KEYWORDS.test(text);
}

export function buildOffTopicPublicReply() {
  return {
    message:
      "I'm Alpha Freight AI — your free UK freight & haulage assistant. I help with loads, RPM, diesel costs, POD, payouts, routes, and how to use Alpha Freight.",
    structuredMessage: {
      mode: "logistics_copilot" as const,
      displayStyle: "card" as const,
      assistantName: "Alpha Freight AI",
      modeLabel: "UK Freight AI",
      knowledgeSource: "public-guard",
      confidence: 95,
      title: "🚛 UK Freight AI — Alpha Freight",
      shortExplanation:
        "I'm built for UK haulage, logistics, and Alpha Freight platform questions — not general chat. Ask me about finding loads, posting freight, RPM, fuel, or getting started.",
      keyPoints: [
        "🚛 Find loads & backhaul lanes in the UK",
        "💰 RPM, profit & diesel cost calculations",
        "📦 POD, tracking & 7-day carrier payouts",
        "📍 How to sign up free on Alpha Freight",
      ],
      recommendation: "💡 Try: What is RPM? · UK diesel price today · How do I find loads?",
      nextStep: "Create a free account for live loads, bids & wallet — Sign up as carrier or supplier.",
      suggestedQuestions: ["What is RPM?", "UK diesel price today", "How do I find loads in the UK?"],
      quickActions: [
        { label: "Find Loads", href: "/find-loads", action: "How do I find loads in the UK?", variant: "primary" as const },
        { label: "Sign Up Free", href: "/auth/select", action: "How do I sign up?", variant: "secondary" as const },
      ],
      rawText:
        "I'm Alpha Freight AI — your free UK freight & haulage assistant.",
    },
  };
}
