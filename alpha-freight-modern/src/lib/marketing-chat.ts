import type { ChatApiResponse } from "@/lib/chat-types";

const SUPPORT_EMAIL = "support@alphafreightuk.com";
const SUPPORT_PHONE = "+44 7782 294718";

type ChatHistoryItem = { role: string; content: string };

function includesAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function greetingReply(): string {
  return "Hi! I'm Alpha Freight AI. I can help with posting loads, finding freight, carrier payouts, live tracking, vetting, and account questions. What would you like to know?";
}

function postLoadReply(): string {
  return `To post a load as a supplier:

1. Sign in and open **Post a Load**
2. Enter pickup & delivery, timing, cargo, equipment, and budget
3. Choose **Pay Instant** or **Pay Later**
4. Publish — AI matching typically finds carriers in under 60 seconds

Need hands-on help? Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE} (Mon–Fri, 8am–6pm GMT).`;
}

function payoutReply(): string {
  return `Carrier payouts on Alpha Freight:

• After **digital POD** is verified, funds move to your **Wallet**
• Standard payout window: **7 days**
• Track balances and withdrawals in **Wallet → Earnings**

For payout delays or wallet setup issues, email ${SUPPORT_EMAIL} with your load reference.`;
}

function trackingReply(): string {
  return `Live tracking on Alpha Freight:

• Carriers share GPS during **in-transit** deliveries
• Suppliers see real-time location on the shipment map
• Tracking stops when the delivery ends

If tracking isn't updating, check the load is marked in-transit and location permissions are enabled on the mobile app.`;
}

function findLoadsReply(): string {
  return `Carriers can find loads via:

• **Available Loads** — browse active marketplace freight
• **Smart Loads** — AI-recommended lanes matched to your fleet
• Submit a bid or accept at the posted rate

Tip: keep your fleet profile and operating regions updated for better matches.`;
}

function aboutReply(): string {
  return `Alpha Freight is a UK logistics platform connecting suppliers with verified carriers through AI load matching, live GPS tracking, and digital POD.

Company: ALPHA FREIGHT SOLUTIONS LIMITED (No. 16860760)
Office: 124 City Road, London EC1V 2NX
Support: ${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`;
}

function supportReply(): string {
  return `Alpha Freight support channels:

• **Live chat** — fastest for active shipment questions
• **Email** — ${SUPPORT_EMAIL} (within ~2 hours)
• **Phone** — ${SUPPORT_PHONE} (Mon–Fri, 8am–6pm GMT)

For urgent live shipments, include your load reference and current status.`;
}

function humanReply(): string {
  return `I'll connect you with our team. Email ${SUPPORT_EMAIL} or call ${SUPPORT_PHONE}. Include your name, account email, and a short description of the issue — we'll respond within 2 hours on business days.`;
}

export function getMarketingChatReply(
  message: string,
  history: ChatHistoryItem[] = []
): ChatApiResponse {
  const text = message.toLowerCase().trim();

  if (/^(how are you|how r u|how are u|how'?s it going|kaise ho|kese ho|theek ho)[.!?\s]*$/i.test(text)) {
    return {
      message:
        "I'm doing well, thanks for asking! I'm **Alpha Freight AI** — ready to help with UK loads, **RPM**, diesel, payouts, or platform questions. What can I help you with today?",
    };
  }

  if (
    /^(hi+|hello+|hey+|hiya|yo+|salam|assalam|assalamu alaikum|aslam|aoa|salaam|good morning|good afternoon|good evening)[.!?\s]*$/i.test(
      text
    )
  ) {
    return { message: greetingReply() };
  }

  if (includesAny(text, ["human", "agent", "person", "talk to", "email support", "real person"])) {
    return { message: humanReply() };
  }

  if (
    includesAny(text, [
      "post a load",
      "post load",
      "how do i post",
      "create load",
      "publish load",
      "supplier post",
    ])
  ) {
    return { message: postLoadReply() };
  }

  if (
    includesAny(text, [
      "payout",
      "pay out",
      "wallet",
      "earnings",
      "get paid",
      "payment carrier",
      "7 day",
      "7-day",
    ])
  ) {
    return { message: payoutReply() };
  }

  if (
    includesAny(text, [
      "track",
      "tracking",
      "gps",
      "live location",
      "shipment map",
      "where is my",
    ])
  ) {
    return { message: trackingReply() };
  }

  if (
    includesAny(text, [
      "find load",
      "available load",
      "smart load",
      "bid",
      "book load",
      "carrier load",
    ])
  ) {
    return { message: findLoadsReply() };
  }

  if (
    includesAny(text, [
      "what is alpha",
      "who are you",
      "about alpha",
      "company",
      "platform",
    ])
  ) {
    return { message: aboutReply() };
  }

  if (includesAny(text, ["support", "help", "contact", "phone", "complaint"])) {
    return { message: supportReply() };
  }

  if (includesAny(text, ["pod", "proof of delivery", "delivery confirmation"])) {
    return {
      message:
        "Carriers upload **digital POD** via the app or web after delivery. Once verified, settlement and payout workflows start automatically. Suppliers can review POD in their load dashboard.",
    };
  }

  if (includesAny(text, ["rpm", "revenue per mile", "rate per mile"])) {
    return {
      message: `## 💰 What is RPM (Revenue Per Mile)?

**RPM** is the standard UK haulage metric for comparing load profitability:

\`RPM = Total load payment ÷ Loaded miles\`

### Worked example

| Load pay | Loaded miles | RPM |
| --- | --- | --- |
| **£800** | 320 mi | **£2.50/mi** |
| £600 | 200 mi | **£3.00/mi** |
| £900 | 400 mi | £2.25/mi |

> [!TIP]
> A **£600 / 200-mile** load (£3.00 RPM) beats **£900 / 400 miles** (£2.25 RPM) on per-mile earnings.

### Why RPM matters

- Normalises comparison between loads of different distances
- Helps set minimum rates before bidding
- Combined with fuel and deadhead, reveals **true profit**

### UK benchmarks

- **Long-haul artic:** target **£2.00–£2.50+** RPM
- **Short regional:** often need **£3.00+** RPM
- At ~**£1.50/litre** diesel and 8 MPG, 320 miles ≈ **£270–£290** fuel cost

<<collapse:How to use RPM on Alpha Freight>>
1. Sort **Available Loads** by rate
2. Calculate RPM before every bid
3. Ask me: *"Calculate profit £800 for 320 miles"*
4. Always factor **empty miles** to pickup and return
<</collapse>>

> [!WARNING]
> Never accept on headline rate alone — subtract fuel, deadhead, and fixed costs first.

Would you like me to calculate RPM for a specific load you're looking at?`,
    };
  }

  if (includesAny(text, ["vet", "verify", "insurance", "compliance"])) {
    return {
      message:
        "Every carrier passes a 5-step vetting flow: identity & registration, insurance verification, safety/compliance checks, equipment review, and performance assessment. This keeps the Alpha network trusted for suppliers.",
    };
  }

  if (
    includesAny(text, [
      "book load",
      "book karna",
      "pehla load",
      "first load",
      "kaise book",
      "load book",
      "load accept",
      "bid accept",
    ])
  ) {
    return {
      message: `Carrier ke liye pehla load book karna — step by step:

1. **Login** karein carrier account se
2. **Available Loads** par jayein — apne route ke loads dekhein
3. Load par click karein aur **Submit Bid** karein (ya direct accept agar fixed rate ho)
4. Supplier bid accept kare → load **My Loads** mein aa jayega
5. Pickup par jayein, status **In Transit** karein, delivery ke baad **Digital POD** upload karein
6. POD verify hone ke baad **Wallet** mein payment 7 din ke andar

Mobile app se bhi same flow — Available Loads → Bid → Track → POD upload.

Help chahiye? ${SUPPORT_EMAIL}`,
    };
  }

  if (includesAny(text, ["thank", "thanks", "shukriya"])) {
    return {
      message: "You're welcome! If you need anything else about Alpha Freight, just ask.",
    };
  }

  if (
    includesAny(text, ["diesel", "desile", "desial", "fuel price", "petrol price"]) ||
    (includesAny(text, ["price", "rate", "cost"]) && includesAny(text, ["uk", "diesel", "desile", "fuel", "petrol"]))
  ) {
    return {
      message: `⛽ **UK Diesel / HGV Fuel Prices**

UK diesel prices change weekly. For carriers, fuel cost directly affects RPM and profit.

**Where to check live UK diesel rates:**
• RAC Fuel Watch — rac.co.uk/fuel-watch
• AA Fuel Price Report — theaa.com/driving advice/fuel prices
• UK GOV fuel statistics — gov.uk

**Quick haulage tip:**
• Average UK diesel is often **£1.45–£1.55/litre** (varies by region)
• Calculate: (total miles ÷ MPG) × fuel price = trip fuel cost
• Always subtract fuel + deadhead from rate before accepting a load

Ask me: *"Calculate profit £800 for 320 miles"* or *"What is RPM?"*`,
    };
  }

  const lastTopic = history
    .slice()
    .reverse()
    .find((item) => item.role === "assistant")?.content;

  const isShortSocial =
    /^(ok|okay|thanks?|thank you|thx|see+\s*ya|see+\s*you|bye+|goodbye|got it|cool|sure|alright|take care|later)[.!?\s]*$/i.test(
      text
    );

  if (isShortSocial && lastTopic) {
    if (/rpm|profit|margin|revenue per mile/i.test(lastTopic)) {
      return {
        message:
          "Glad that helped with RPM — if you want to run the numbers on another load, just send the rate and miles.",
      };
    }
    if (/diesel|fuel|petrol/i.test(lastTopic)) {
      return {
        message:
          "You're welcome — plug your latest diesel price into the RPM calc before you book the next run.",
      };
    }
    if (/^(see+\s*ya|see+\s*you|bye+|goodbye|take care|later)/i.test(text)) {
      return {
        message: "Take care and drive safe — come back anytime you need freight help.",
      };
    }
    return {
      message: "You're welcome — just ask if anything else comes up on loads, rates, or the platform.",
    };
  }

  if (
    text.length <= 24 &&
    lastTopic &&
    /\b(load|freight|haul|rpm|bid|pod|payout|carrier|supplier|alpha|book|post|wallet|track)\b/i.test(text)
  ) {
    return {
      message: `Happy to help with more detail on that. Could you tell me if you're a **supplier** or **carrier**, and what step you're stuck on? You can also email ${SUPPORT_EMAIL} for direct support.`,
    };
  }

  if (/\b(weather|forecast|wather|rain|temperature)\b/i.test(text)) {
    const cityMatch = text.match(
      /\b(london|manchester|birmingham|leeds|glasgow|liverpool|bristol|sheffield|edinburgh|cardiff|nottingham|newcastle)\b/i
    );
    const place = cityMatch ? cityMatch[1] : "your area";
    return {
      message: `### Quick Answer

I couldn't reach the live weather API from this server right now, so here's how to check **${place}** quickly:

- [BBC Weather — ${place}](https://www.bbc.co.uk/weather)
- [Met Office UK forecast](https://www.metoffice.gov.uk/)

> [!INFO]
> **Tip for carriers:** Check wind, rain, and visibility before tight delivery windows — add buffer on wet or windy days.

### Alpha Freight can help with
Loads, **RPM**, fuel cost, and route planning — e.g. *"Find loads London to Manchester"* or *"Calculate profit £800 for 320 miles"*.

If live AI answers aren't loading, try **VPN** or deploy to production — OpenAI may be blocked on some local networks.`,
    };
  }

  if (/\b(traffic|motorway|m\d+|delay|closure|accident)\b/i.test(text)) {
    return {
      message: `For live **UK traffic**, check [National Highways](https://nationalhighways.co.uk/traffic/) or Google Maps traffic layer before you roll.

Need help with a **load, RPM, or backhaul** on that route? Ask me — e.g. "Find loads Manchester to London".`,
    };
  }

  return {
    message: `I can help with posting loads, finding freight, payouts, live tracking, POD, and account questions.

Try asking something like:
• "How do I post a load?"
• "How do carrier payouts work?"
• "Help with live tracking"

Or email ${SUPPORT_EMAIL} for human support.`,
  };
}
