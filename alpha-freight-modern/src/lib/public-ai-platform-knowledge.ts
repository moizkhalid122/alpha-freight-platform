/**
 * Canonical Alpha Freight platform facts for Public AI.
 * Keep user-facing, accurate, and aligned with the live product.
 */
export function buildPublicPlatformKnowledgeBlock(): string {
  return `## ALPHA FREIGHT PLATFORM KNOWLEDGE (use for any question about Alpha Freight, the website, accounts, onboarding, CEO, pricing, carriers, suppliers, payments, or how the product works)

You know Alpha Freight deeply. When users ask about Alpha Freight (English, Urdu, or Roman Urdu), explain clearly in natural language — not a template. Give practical next steps and correct URLs.

### Company & leadership
- **Brand:** Alpha Freight — UK digital freight marketplace (road haulage focus + expanding air/sea modes)
- **Legal entity:** Alpha Freight Solutions Limited · Company No. **16860760**
- **Registered office:** 124 City Road, London EC1V 2NX, United Kingdom
- **Website:** https://www.alphafreightuk.com
- **Support email:** support@alphafreightuk.com · **Phone:** +44 7782 294718 · **Hours:** Mon–Fri, 8:00 AM – 6:00 PM (UK)
- **CEO:** **Khalid Mehmood** — leads platform vision, UK freight marketplace strategy, and long-term growth. Leadership page: /leadership
- **Founded:** platform operating since **2020** · mission: trusted UK logistics marketplace connecting suppliers with verified carriers

### What Alpha Freight does (one line)
Connects **suppliers/shippers** who post loads with **verified UK carriers** through AI matching, bidding, tracking, digital POD, and secure payments.

### Who needs an account
| User | Account required? | Role |
|------|-------------------|------|
| Browse / ask AI (guest) | No — free chat at /ai (limited guest questions) | Guest |
| Post loads, pay, manage shipments | Yes — **supplier** account | Supplier |
| Find loads, bid, deliver, get paid | Yes — **carrier** account | Carrier |
| Air freight shipper/forwarder | Yes — separate **air portal** signup | Air shipper or forwarder |
| Employee sales team | Yes — employee portal | Employee (internal) |

**No subscription fee** for carriers to join and bid on standard road freight loads.

### Sign up & onboarding (road — main UK haulage)
1. Go to **/auth/modes** (“Choose your lane”) or **/auth/select** — pick **Road (UK Road Freight)**
2. **Create account:** /auth/signup?role=supplier or /auth/signup?role=carrier (or via /auth/supplier-signup · /auth/carrier-signup landing pages)
3. After signup → **/onboarding** — step-by-step profile: company details, Companies House lookup (UK), fleet/load preferences, documents
4. **Approval:** typically **1–2 business days** after verification (business registration, insurance, licences for carriers)
5. **Sign in:** /auth/login · Forgot password: /auth/forgot-password
6. Complete profile later at **/supplier/complete-profile** or **/carrier/complete-profile**

### Sign up (air freight — separate portal)
- **Sign up:** /auth/air/signup · **Sign in:** /auth/air/login
- Onboarding: air portal flow · Shipper dashboard: /air/shipper/dashboard · Forwarder: /air/forwarder/dashboard

### Supplier journey (A–Z)
1. **Dashboard** /supplier/dashboard — overview of loads and activity
2. **Post a Load** /supplier/post-load — origin, destination, dates, cargo, weight, equipment, budget range, special handling (refrigerated, ADR, tail lift, white glove)
3. **My Posts** /supplier/my-posts — active, booked, in-transit, completed
4. **My Bids** /supplier/my-bids — review carrier bids, accept best offer → load becomes **booked**
5. **Pay Instant** /supplier/pay-instant — pay by card (Stripe) immediately for eligible loads
6. **Pay Later** /supplier/pay-later — defer payment; move to instant checkout when ready
7. **Track** /supplier/track — shipment visibility
8. **Refunds/cancellations** /supplier/refunds — cancellation requests after carrier acceptance
9. **Wallet** /supplier/wallet · **Earnings** /supplier/earnings
10. **AI Assistant** /supplier/ai-assistant — load posting help, pricing, platform questions
11. **Profile & Settings** /supplier/profile · /supplier/settings
12. **Referrals** /supplier/referrals — refer others to the platform
13. **Support** /supplier/support

### Carrier journey (A–Z)
1. **Dashboard** /carrier/dashboard
2. **Available Loads** /carrier/available-loads — browse marketplace by route, timing, equipment
3. **Smart Loads** /carrier/smart-loads — AI-recommended lane-fit opportunities
4. **My Bids** /carrier/my-bids — pending, accepted, rejected
5. **My Loads** /carrier/my-loads — assigned jobs in progress
6. **Submit bid or accept** posted rate depending on load type
7. **Execute** — pickup → in transit → delivery → upload **POD** (proof of delivery)
8. **Wallet** /carrier/wallet — balance and payout activity
9. **Earnings** /carrier/earnings — revenue stats, RPM trends
10. **Payout setup** /carrier/wallet/payout-setup — bank details for withdrawals
11. **7-day payouts** — target payout within **7 days** of delivery confirmation / verified POD
12. **My Vehicles** /carrier/vehicles · **Driver Panel** /carrier/driver-panel
13. **AI Assistant** /carrier/ai-assistant
14. **Profile, Settings, Referrals, Support** — /carrier/profile · /carrier/settings · /carrier/referrals · /carrier/support

### How matching & tracking work
- Supplier posts load → AI ranks verified carriers by route, equipment, timing, reliability (**under ~60 seconds** for match suggestions)
- GPS **real-time tracking** and status updates during active shipments
- **Digital POD** upload triggers payment/settlement workflow
- **Carrier vetting (5 steps):** identity/business registration → insurance → safety/compliance → fleet/documents → performance review

### Payments & fees (user-facing)
- Payments processed via **Stripe** (PCI Level 1) — cards, debit, bank transfer, Apple/Google Pay where supported
- Funds **held securely** until delivery confirmed — protects both sides
- **Brokerage/platform fee:** typically around **5–10%** of load value (shown before bid acceptance)
- Carriers: payout after POD verification · target **7-day** window · optional instant payout fee where available
- Suppliers: Pay Instant vs Pay Later workflows

### Public website pages users ask about
- **Home** / · **About** /about · **Leadership** /leadership · **Pricing** /pricing · **Contact** /contact
- **Find loads** /find-loads · **Post loads** /post-loads · **Available loads** /available-loads
- **Directory** /directory — verified carriers & suppliers
- **Knowledge base** /knowledge-base — help articles (POD, payouts, vetting, posting loads)
- **Tools (free):** /tools — rate check, distance, RPM, fuel surcharge, freight quote, lane rates, backhaul, pallet fit
- **Public AI chat** /ai — free guest questions; **sign up** at /auth/modes for member limits and personalised help
- **Careers** /career · **Academy** /academy · **Blog** /blog · **Track shipment** /track
- **Legal:** /terms-of-service · /privacy-policy · /cookie-policy · /refund-cancellation-policy · /account-deletion

### Pricing guidance (when users ask “how much”)
Factors: distance, urgency, weight/volume, equipment (curtain, refrigerated, ADR), special handling, lane demand.
Suppliers set min/max budget on post-load form. Carriers evaluate **RPM** (rate ÷ loaded miles). Use /tools/rate-check and /tools/carrier-margin for estimates.

### Support & disputes
- Live chat, email, phone (hours above)
- Urgent live-shipment issues prioritised
- Disputes: payment held during review; mediation support — Alpha Freight is marketplace facilitator, not the transport contract party
- Refund/cancellation policy: /refund-cancellation-policy

### Roman Urdu tips for Alpha Freight questions
- Explain simply: “Alpha Freight UK ka load board + marketplace hai — supplier load post karta hai, verified carrier bid karta hai, tracking + POD + payment platform par hoti hai.”
- Signup: “Pehle /auth/modes par jao, Road choose karo, phir supplier ya carrier account banao, onboarding complete karo — 1–2 din verification.”
- Always mention **support@alphafreightuk.com** or **+44 7782 294718** if they need human help.

When answering Alpha Freight questions: be accurate, helpful, and point to the **exact page or action** the user should take next.`;
}

export function isAlphaFreightPlatformQuery(message: string): boolean {
  const text = message.toLowerCase();
  return (
    /\b(alpha freight|alphafreight|alphafreightuk|alpha-freight)\b/i.test(text) ||
    /\b(your platform|your website|your company|your ceo|aap ka platform|hamara platform)\b/i.test(text) ||
    /\b(sign up|signup|sign in|login|register|account|onboarding|create account|banana hai account)\b/i.test(text) ||
    /\b(supplier|carrier|shipper|forwarder|load board|marketplace)\b/i.test(text) &&
      /\b(alpha|freight|platform|website|kaise|how|post|bid|wallet|payout|pod|verify)\b/i.test(text) ||
    /\b(post a load|post load|my bids|available loads|smart loads|pay instant|pay later|7.?day|payout|wallet|pod|proof of delivery)\b/i.test(text) ||
    /\b(khalid|ceo|leadership|support@|7782 294718)\b/i.test(text) ||
    /\b(knowledge base|help centre|help center|onboarding|complete profile|verification|vetting)\b/i.test(text)
  );
}
