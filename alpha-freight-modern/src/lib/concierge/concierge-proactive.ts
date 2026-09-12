export type ProactiveNudge = {
  id: string;
  message: string;
  idleMs: number;
};

const PROACTIVE_BY_PATH: Array<{ match: (path: string) => boolean; nudge: ProactiveNudge }> = [
  {
    match: (path) => path === "/",
    nudge: {
      id: "home-vip",
      message: "Hey — I'm Alpha. Ask me anything about freight, pricing, or loads.",
      idleMs: 22_000,
    },
  },
  {
    match: (path) => path.startsWith("/pricing"),
    nudge: {
      id: "pricing-fees",
      message: "Want me to break down carrier vs supplier fees?",
      idleMs: 24_000,
    },
  },
  {
    match: (path) => path.startsWith("/about") || path.startsWith("/solution"),
    nudge: {
      id: "about-platform",
      message: "Ask how Alpha works — happy to walk you through it.",
      idleMs: 26_000,
    },
  },
  {
    match: (path) => path.includes("/auth/signup"),
    nudge: {
      id: "signup-help",
      message: "Tell me your name and email — I'll fill the form. Say create account when ready.",
      idleMs: 20_000,
    },
  },
  {
    match: (path) => path.startsWith("/auth/login"),
    nudge: {
      id: "login-help",
      message: "Need help signing in? I can highlight the email field or open signup.",
      idleMs: 24_000,
    },
  },
  {
    match: (path) => path.startsWith("/onboarding"),
    nudge: {
      id: "onboarding-vip",
      message: "Say continue or next — I'll press the button for you.",
      idleMs: 16_000,
    },
  },
  {
    match: (path) => path.includes("/find-loads") || path.includes("/available-loads"),
    nudge: {
      id: "find-loads",
      message: "I can explain load matching — or help you find available loads.",
      idleMs: 22_000,
    },
  },
  {
    match: (path) => path.includes("/post-load") && !path.startsWith("/supplier/post-load"),
    nudge: {
      id: "post-loads-info",
      message: "Supplier? Say post a load and I'll open the form for you.",
      idleMs: 24_000,
    },
  },
  {
    match: (path) => path.startsWith("/carrier/dashboard"),
    nudge: {
      id: "carrier-dashboard",
      message: "VIP carrier — say show my loads, find loads, or earnings.",
      idleMs: 28_000,
    },
  },
  {
    match: (path) => path.startsWith("/carrier/my-loads"),
    nudge: {
      id: "carrier-my-loads",
      message: "Need available loads? Say find loads and I'll open the board.",
      idleMs: 30_000,
    },
  },
  {
    match: (path) => path.startsWith("/carrier/available-loads"),
    nudge: {
      id: "carrier-available",
      message: "See a good load? Open it and bid — or ask me about RPM.",
      idleMs: 30_000,
    },
  },
  {
    match: (path) => path.startsWith("/carrier/earnings") || path.startsWith("/carrier/wallet"),
    nudge: {
      id: "carrier-earnings",
      message: "Ask when payouts arrive — Alpha targets 7-day carrier pay.",
      idleMs: 32_000,
    },
  },
  {
    match: (path) => path.startsWith("/supplier/dashboard"),
    nudge: {
      id: "supplier-dashboard",
      message: "VIP supplier — say post a load or track shipment.",
      idleMs: 28_000,
    },
  },
  {
    match: (path) => path.startsWith("/supplier/post-load"),
    nudge: {
      id: "supplier-post-load",
      message: "Describe your load aloud — I can help fill the form step by step.",
      idleMs: 22_000,
    },
  },
  {
    match: (path) => path.startsWith("/supplier/my-posts") || path.startsWith("/supplier/track"),
    nudge: {
      id: "supplier-track",
      message: "Say track shipment or open bids — I'll navigate for you.",
      idleMs: 30_000,
    },
  },
  {
    match: (path) => path.startsWith("/contact"),
    nudge: {
      id: "contact-fill",
      message: "Tell me your message — I'll fill the contact form and press send.",
      idleMs: 26_000,
    },
  },
  {
    match: (path) => path.startsWith("/support") || path.startsWith("/help"),
    nudge: {
      id: "support",
      message: "Stuck? Describe the issue — I'll guide you or open contact.",
      idleMs: 28_000,
    },
  },
  {
    match: (path) => path.startsWith("/tools"),
    nudge: {
      id: "tools",
      message: "Need RPM or margin help? Ask me on any calculator page.",
      idleMs: 30_000,
    },
  },
  {
    match: (path) => path.startsWith("/carrier-information"),
    nudge: {
      id: "carrier-info",
      message: "Want to know how carriers join Alpha? Just ask — I'll explain step by step.",
      idleMs: 26_000,
    },
  },
  {
    match: (path) => path.startsWith("/supplier-information"),
    nudge: {
      id: "supplier-info",
      message: "Shipping freight? Ask how suppliers post loads — happy to walk you through it.",
      idleMs: 26_000,
    },
  },
  {
    match: (path) => path.startsWith("/ai"),
    nudge: {
      id: "ai-page",
      message: "Prefer voice? Tap the orb — VIP Alpha listens live.",
      idleMs: 18_000,
    },
  },
];

/** Fallback for any other public marketing page */
const DEFAULT_NUDGE: ProactiveNudge = {
  id: "general-vip",
  message: "I'm Alpha — tap the orb and talk. I'll navigate, fill forms, and press buttons for you.",
  idleMs: 32_000,
};

export function getProactiveNudge(pathname: string): ProactiveNudge | null {
  if (
    pathname.startsWith("/ops-") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/team-af") ||
    pathname.startsWith("/comm-af")
  ) {
    return null;
  }

  for (const entry of PROACTIVE_BY_PATH) {
    if (entry.match(pathname)) return entry.nudge;
  }

  return DEFAULT_NUDGE;
}
