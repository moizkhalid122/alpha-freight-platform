import type { ChatApiResponse } from "@/lib/chat-types";
import { calculateProfit, extractProfitFromMessage } from "@/lib/copilot/profit-calculator";

type HistoryItem = { role: string; content: string };

const SUPPORT_EMAIL = "support@alphafreightuk.com";

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function coldCallCarrierReply(): string {
  return `### UK carrier cold call opener (copy-paste)

**Opening (10 seconds):**
> "Hi, is this **[Name / Transport Manager]**? It's **[Your name]** from **Alpha Freight** — we're a UK load-matching platform. I'll keep it brief: do you ever run loads where you'd want extra backhaul or better-paying lanes without chasing brokers all day?"

**If they say "What's this about?":**
> "We connect verified carriers to suppliers who post live loads — you bid or accept, track in-app, upload POD, and get paid through wallet. No subscription for carriers. I'm calling to see if **[region they operate]** is a lane you cover."

**Qualify (pick 2):**
1. "How many trucks are you running — owner-op or small fleet?"
2. "Which regions do you cover most — Midlands, North, South?"
3. "Are you mostly full truckload or mixed?"
4. "Who usually finds your loads today — load board, broker, or direct customers?"

**Soft close:**
> "If it sounds useful, I can send a 2-minute overview and you can browse loads free — no pressure. What's the best email or WhatsApp?"

**After the call — log in CRM:**
- Status → **Contacted**
- Note: fleet size, lanes, current load source
- Next follow-up: **2–3 days** if warm, **1 week** if "send info only"

**Tip:** Smile when you dial — they hear it. First 8 seconds decide if they stay on the line.`;
}

function coldCallSupplierReply(): string {
  return `### UK supplier cold call opener

**Opening:**
> "Hi **[Name]**, **[Your name]** from **Alpha Freight**. Quick one — do you ever struggle to find reliable carriers at short notice, or chase POD and updates on active jobs?"

**Value hook:**
> "We match your loads to vetted UK carriers in under 60 seconds, with live GPS tracking and digital POD — so you're not ringing round at 5pm wondering where the truck is."

**Qualify:**
- "How many loads do you move per week/month?"
- "Typical lanes — local, national, or both?"
- "What's painful today — price, reliability, or visibility?"

**Close:**
> "Happy to show a 5-minute demo or you can post a test load free. Best email to send details?"

**CRM:** Log as **Contacted**, note volume + pain point, follow-up in 48 hours.`;
}

function priceObjectionReply(): string {
  return `### Handling price objections (freight sales)

| Objection | Response |
|-----------|----------|
| **"Too expensive"** | "Compared to what — your last broker margin or a missed slot cost? Let's look at **total cost**: rate, empty miles, and time chasing updates." |
| **"We already have carriers"** | "Most teams keep their core carriers — we fill **overflow, backhaul, and new lanes** when your usual pool is full." |
| **"Send an email"** | "Absolutely — so I send something useful: what's your typical lane and weekly volume? One line helps me tailor it." |
| **"Not interested"** | "Fair enough — if anything changes on capacity or pricing, we're here. Can I check back in **[3 months / next quarter]**?" |
| **"Your commission / fee is high"** | "Our fee only applies when a load **books and completes** — you're paying for vetted carriers, tracking, and POD, not dead leads." |

**Framework — LAER:**
1. **Listen** — let them finish
2. **Acknowledge** — "That makes sense given…"
3. **Explore** — "What would 'good value' look like for you?"
4. **Respond** — one clear benefit + proof (tracking, payout speed, UK-only network)

**Never argue price in the first 30 seconds.** Get the problem first, then reframe value.`;
}

function followUpEmailReply(): string {
  return `### Follow-up email after demo (template)

**Subject:** Alpha Freight — next steps for [Company name]

Hi [Name],

Good speaking today — thanks for your time.

**Quick recap:**
- You run [X loads / lanes / fleet size]
- Main priority: [reliability / cost / visibility / backhaul]

**What Alpha Freight gives you:**
- Live load board matched to your lanes
- Vetted carriers + digital POD + wallet payouts
- No carrier subscription — suppliers pay when loads complete

**Suggested next step:** [Book 15-min setup / Post first test load / Browse loads as carrier]

I'm free [Day/time] or reply with a time that suits you.

Best,
[Your name]
Alpha Freight | ${SUPPORT_EMAIL}

---

**CRM:** Set follow-up date, status **Interested**, attach this email in notes.`;
}

function commissionReply(): string {
  return `### Employee commission structure (Alpha Freight)

**How it works:**
1. You bring a **carrier or supplier** lead through CRM
2. Lead progresses: New → Contacted → Interested → **Won**
3. When deal is **Won**, commission is created in **My Commission** (typically **pending** until paid)

**Typical rate:** ~**8% of closed deal value** (confirm exact % with your manager / handbook)

**Example:**
- Closed deal value: **£10,000**
- Commission at 8%: **£800**

**Your daily workflow:**
- Log every call in **My Calls** (link to lead)
- Update lead status after each touch
- Set **next follow-up** — check **Due Today** every morning
- Mark **Won** only when deal is confirmed closed

**Payment:** Bank details in **My Commission** → paid per company payroll cycle once approved.

Questions on a specific deal? Ask your team lead or HR.`;
}

function crmLoggingReply(): string {
  return `### What to log in CRM after every call

**Minimum (30 seconds):**
1. **My Calls** → Log call → link to lead
2. **Outcome:** answered / voicemail / wrong number / callback requested
3. **One-line note:** e.g. "3-truck fleet, Midlands–Scotland, uses broker today"
4. **Lead status:** New → **Contacted** (first touch) or **Interested** (if engaged)
5. **Next follow-up date** — never leave blank

**Good note example:**
> "Spoke to Dave (ops). 5 artic, Birmingham base. Pain: empty return from Manchester. Sent WhatsApp intro. Callback Thu 10am."

**Queues to check daily:**
- **Due Today** — follow-ups due
- **Overdue** — priority first
- **No follow-up** — set a date on every active lead

**Won deals:** Update to **Won** → commission auto-tracks in **My Commission**.`;
}

function employeeGreetingReply(): string {
  return `Hey — I'm **Team AI**, your internal sales coach.

Ask me for:
- **Cold call scripts** (carrier or supplier)
- **Objection handling**
- **Follow-up emails**
- **CRM logging** & lead status
- **Commission** questions
- **RPM / profit** calculations

What are you working on today?`;
}

function rpmProfitReply(message: string): string | null {
  const inputs = extractProfitFromMessage(message);
  if (!inputs?.rate || !inputs?.loadedMiles) return null;

  const result = calculateProfit({ rate: inputs.rate, loadedMiles: inputs.loadedMiles });
  return `### Profit & RPM

| Metric | Value |
|--------|-------|
| **Load rate** | £${inputs.rate.toFixed(2)} |
| **Loaded miles** | ${inputs.loadedMiles} mi |
| **RPM** | £${result.rpm.toFixed(2)}/mile |
| **Est. gross profit** | £${result.grossProfit.toFixed(2)} |

${result.summary}

**Sales tip:** If RPM is below **£2.00/mi** on long haul, flag fuel and deadhead — carriers often reject or renegotiate.

**Next:** Log this in your lead note if you're quoting a lane.`;
}

function employeeDefaultReply(): string {
  return `I'm **Team AI** — your internal Alpha Freight sales coach.

I help with **cold calls**, **objections**, **follow-up emails**, **CRM**, **commission**, and **UK freight** (RPM, loads, POD).

**Try asking:**
- "Write a cold call opener for a UK carrier"
- "How do I handle price objections?"
- "Draft a follow-up email after a demo"
- "What should I log in CRM after a call?"

For live AI answers, ensure you're online — if responses stay generic, check VPN/network or ask IT. Human support: ${SUPPORT_EMAIL}`;
}

export function getEmployeeTeamAiReply(message: string, history: HistoryItem[] = []): ChatApiResponse {
  const text = message.toLowerCase().trim();

  if (/^(hi+|hello+|hey+|salam|aoa|good morning|good afternoon)[.!?\s]*$/i.test(text)) {
    return { message: employeeGreetingReply() };
  }

  if (/^(thanks?|thank you|ok|okay|got it|cheers)[.!?\s]*$/i.test(text)) {
    const lastTopic = [...history].reverse().find((h) => h.role === "user")?.content?.toLowerCase() || "";
    if (/cold call|opener|script/i.test(lastTopic)) {
      return { message: "Anytime — practice the opener twice out loud before you dial. Want a **supplier** version or objection handling next?" };
    }
    return { message: "You're welcome — good luck on the calls today. Ask anytime you need a script or CRM tip." };
  }

  const profitReply = rpmProfitReply(message);
  if (profitReply) {
    return { message: profitReply };
  }

  if (
    includesAny(text, ["cold call", "cold-call", "opener", "opening line", "opening script", "first line"]) ||
    (/write|give|draft|create/i.test(text) && includesAny(text, ["script", "opener", "call"]))
  ) {
    if (includesAny(text, ["supplier", "shipper", "customer", "client"])) {
      return { message: coldCallSupplierReply() };
    }
    return { message: coldCallCarrierReply() };
  }

  if (
    includesAny(text, [
      "objection",
      "too expensive",
      "not interested",
      "price is high",
      "already have",
      "send email",
      "handle no",
    ])
  ) {
    return { message: priceObjectionReply() };
  }

  if (
    includesAny(text, ["follow-up email", "follow up email", "followup email", "after demo", "after call email", "email template"])
  ) {
    return { message: followUpEmailReply() };
  }

  if (includesAny(text, ["commission", "my commission", "earn", "payout", "8%", "bonus"])) {
    return { message: commissionReply() };
  }

  if (
    includesAny(text, ["crm", "log after", "what to log", "lead status", "follow-up date", "my calls", "due today"])
  ) {
    return { message: crmLoggingReply() };
  }

  if (includesAny(text, ["rpm", "profit", "margin", "calculate"]) && includesAny(text, ["load", "mile", "£", "800", "320"])) {
    const profit = rpmProfitReply(message);
    if (profit) return { message: profit };
  }

  if (includesAny(text, ["training", "handbook", "document", "onboarding"])) {
    return {
      message: `Check **Training** and **Documents** in your employee portal for scripts, compliance, and product guides.

For quick help now, ask me:
- Cold call script for carrier or supplier
- Objection handling
- CRM logging checklist

Team lead or HR for policy questions.`,
    };
  }

  return { message: employeeDefaultReply() };
}

export function buildEmployeeKnowledgeReply(
  message: string,
  history: HistoryItem[] = []
): { message: string; structuredMessage: import("@/lib/chat-types").StructuredAssistantReply } {
  const { message: text } = getEmployeeTeamAiReply(message, history);

  const structured: import("@/lib/chat-types").StructuredAssistantReply = {
    mode: "logistics_copilot",
    displayStyle: "plain",
    assistantName: "Team AI",
    modeLabel: "Team AI",
    knowledgeSource: "employee-knowledge",
    confidence: 92,
    title: "",
    shortExplanation: text,
    keyPoints: [],
    recommendation: "",
    nextStep: "",
    suggestedQuestions: [],
    quickActions: [],
    rawText: text,
  };

  return { message: text, structuredMessage: structured };
}

export function buildEmployeeFastReply(
  message: string,
  history: HistoryItem[] = []
): { message: string; structuredMessage: import("@/lib/chat-types").StructuredAssistantReply } | null {
  const text = message.toLowerCase().trim();

  const isEmployeeSalesQuery =
    includesAny(text, [
      "cold call",
      "opener",
      "opening",
      "script",
      "objection",
      "follow-up email",
      "follow up email",
      "commission",
      "crm",
      "log after",
      "what to log",
      "my calls",
    ]) ||
    (/write|give|draft|create|how do i|how to/i.test(text) &&
      includesAny(text, ["carrier", "supplier", "call", "email", "lead", "sales"]));

  if (!isEmployeeSalesQuery && !extractProfitFromMessage(message)?.rate) {
    return null;
  }

  return buildEmployeeKnowledgeReply(message, history);
}
