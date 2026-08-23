export const EXECUTIVE_AGREEMENT_META = {
  company: "Alpha Freight Solutions Limited",
  companyNumber: "16860760",
  registeredOffice: "124 City Road, London EC1V 2NX, United Kingdom",
  title: "Final Executive, Operational & Remuneration Agreement",
  subtitle: "Comprehensive Draft — Prepared from the documents and written confirmations provided",
  effectiveDate: "23 August 2026",
  status: "Draft for final legal review and execution",
  docRef: "AF-EXEC-AGR",
  confidential: "Confidential · Draft for legal review",
  legalNotice:
    "IMPORTANT: This is a commercial drafting document, not legal advice. It must be checked against Alpha Freight Solutions Limited's articles, existing contracts, payroll/tax requirements and applicable UK law by a qualified UK professional before signature.",
  parties: [
    { role: "CEO & Shareholder", name: "Khalid Mehmood" },
    { role: "Commercial Director", name: "Alastair" },
  ],
  relatedDocs: [
    { label: "Master Plan Part 1", href: "/master-plan" },
    { label: "Revenue Plan Part 2", href: "/revenue-model" },
  ],
};

export type AgreementSection = {
  number: string;
  title: string;
  body?: string[];
  bullets?: string[];
  callout?: string;
  subsections?: { heading: string; bullets: string[] }[];
};

export const EXECUTIVE_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    number: "01",
    title: "Purpose & Status",
    body: [
      "This Agreement consolidates the Master Operational Framework, Operational & Salary Plan, Financial Reconciliation Plan, CEO & Shareholder Remuneration Addenda, and the written funding confirmations exchanged between the parties.",
      "The purpose is to establish one clear framework covering leadership roles, remuneration, payroll, operational responsibility, financial controls, company-level funding and protection against personal funding obligations.",
      "Mandatory law, the Company's constitutional documents and properly adopted corporate resolutions prevail where legally required.",
    ],
  },
  {
    number: "02",
    title: "Parties & Roles",
    bullets: [
      "Alpha Freight Solutions Limited is the Company.",
      "Khalid Mehmood is the Chief Executive Officer (CEO) and shareholder.",
      "Alastair is the Commercial Director and is responsible for commercial and operational leadership within the authority delegated to him.",
      "Operational delegation does not remove the CEO/shareholder's corporate governance role, and CEO/shareholder status does not make Khalid personally liable for Company debts merely because of his office.",
    ],
  },
  {
    number: "03",
    title: "Commercial Director — Operational Responsibilities",
    bullets: [
      "End-to-end freight and logistics execution, including road, air and ocean movements.",
      "Carrier and supplier network management, procurement, rate negotiation, SLA management and partner onboarding.",
      "Daily freight operations, tracking, dispatch, customs/compliance documentation and exception handling.",
      "Process optimisation, workflow automation, TMS integration, operational P&L efficiency and margin improvement.",
      "Commercial development, client acquisition, commercial relationships and readiness of the Company for launch and scale.",
    ],
  },
  {
    number: "04",
    title: "CEO & Shareholder — Executive Responsibilities",
    bullets: [
      "Strategic vision, corporate growth strategy, commercial expansion and enterprise partnerships.",
      "Governance and compliance oversight, capital allocation and banking relationships.",
      "Investor/shareholder relations and high-level commercial/equity decisions.",
      "Approval and oversight of material Company commitments through appropriate corporate processes.",
      "The CEO/shareholder retains governance responsibility even where day-to-day commercial operations are delegated.",
    ],
  },
  {
    number: "05",
    title: "Remuneration Options",
    subsections: [
      {
        heading: "Option A — Fixed Salary",
        bullets: [
          "CEO base salary £90,000–£110,000 per year, with 10%–15% annual performance bonus subject to agreed targets.",
          "The source documents describe this as fixed operating expenditure.",
        ],
      },
      {
        heading: "Option B — Combined CEO/MD",
        bullets: [
          "£75,000–£95,000 per year, with 10% annual profit share.",
          "The source documents describe this as consolidating the Managing Director line with the CEO/MD structure.",
        ],
      },
      {
        heading: "Option C — Tax-Efficient Equity & Dividends",
        bullets: [
          "£12,570 per year as the statutory/base level stated in the source documents, plus quarterly equity dividends from lawful distributable profits based on shareholding.",
        ],
      },
    ],
    callout:
      "The source plan recommends Option B for the initial growth/stabilisation phase and Option C for a later scale/yield phase once retained earnings are consistent. The final selected option must be written in Schedule A before implementation. Dividends are not guaranteed salary and can only be paid where legally permitted and properly approved.",
  },
  {
    number: "06",
    title: "Payroll & Salary Implementation",
    bullets: [
      "Any salary formally selected and approved shall be administered through the Company's proper payroll/PAYE process.",
      "Salary is a Company obligation once it is properly due under the executed employment/service arrangement and applicable law.",
      "Bonuses and profit shares remain subject to their stated conditions, accounting treatment and required approvals.",
      "The exact salary, commencement date and payment frequency must be completed in Schedule A.",
      "Payroll records, payslips, deductions and required HMRC reporting should be maintained properly.",
    ],
  },
  {
    number: "07",
    title: "Company-Level Funding — Core Agreement",
    body: [
      "Alastair expressly confirmed in writing: \"I will approve it and I will do commercial funding.\"",
      "When asked who would arrange and maintain the commercial funding facility, Alastair answered: \"Me\" and \"It will be handled at company level.\" He also stated: \"I will sort that out.\"",
      "Accordingly, the agreed mechanism is Company-level commercial funding for payroll or working-capital shortfalls rather than personal funding by Khalid.",
    ],
    bullets: [
      "Potential mechanisms identified in the documents include third-party commercial funding, corporate debt facilities, revolving credit, invoice discounting and other Company-level working-capital arrangements.",
      "Alastair's responsibility is to pursue, coordinate and arrange appropriate Company-level commercial funding within his commercial role. This does not make Alastair personally liable for every Company borrowing unless he separately signs a personal guarantee.",
    ],
  },
  {
    number: "08",
    title: "CEO/Shareholder Personal Liability Protection",
    bullets: [
      "Khalid is not required to provide a shareholder working-capital loan to cover Company payroll shortfalls.",
      "Khalid is not required to inject personal capital merely because the Company has insufficient cash.",
      "Khalid is not required to use personal savings or personal credit to meet Company payroll.",
      "No personal guarantee, indemnity or security over Khalid's personal assets is implied by this Agreement.",
      "Any future personal funding or guarantee must be a separate written document expressly agreed and signed for that purpose.",
      "Company liabilities remain Company liabilities, subject to applicable law and any separately signed personal obligation.",
    ],
  },
  {
    number: "09",
    title: "How a Payroll Shortfall Is to Be Handled",
    bullets: [
      "Where payroll becomes due or a shortfall is reasonably anticipated, the Company should identify the cash requirement through its cash-flow process.",
      "The Commercial Director should arrange or coordinate appropriate Company-level commercial funding.",
      "The funding is made available to the Company under the relevant facility, if approved and available.",
      "The Company then uses Company funds to meet lawful payroll obligations.",
      "Khalid does not personally fund the shortfall under this Agreement.",
      "Once a facility is established, its lender, limit, interest, fees, security and repayment terms must be recorded in the Company's financial records.",
    ],
  },
  {
    number: "10",
    title: "Important Limit of the Funding Clause",
    bullets: [
      "This Agreement records the agreed funding responsibility and the Company's intended mechanism; it does not itself create a bank facility or guarantee that a lender will approve funding.",
      "The Company must therefore arrange appropriate funding in advance where reasonably possible and must not create payroll commitments without proper financial planning.",
      "If external funding cannot be obtained on commercially acceptable terms, the parties must review the operating plan and commitments rather than automatically transferring the shortfall to Khalid personally.",
    ],
  },
  {
    number: "11",
    title: "Cash Reserve & Financial Discipline",
    bullets: [
      "The source documents proposed an operating cash reserve and described a 30–60 day operating reserve concept.",
      "Payroll, taxes, suppliers and essential operating costs should be prioritised before discretionary distributions.",
      "Expansion of headcount should be linked to cash-flow capacity and, where stated in the operational plan, cumulative Net Brokerage Income (NBI) coverage.",
      "Variable remuneration should be managed so that fixed operating commitments remain sustainable.",
    ],
  },
  {
    number: "12",
    title: "Financial Controls & Banking Access",
    bullets: [
      "Khalid should receive appropriate Company financial information necessary for CEO/shareholder governance, subject to lawful access controls.",
      "This does not mean unrestricted sharing of banking credentials, passwords or security codes.",
      "Payment authority should be defined in writing through bank mandates and Company approval thresholds.",
      "The Company should maintain management accounts, payroll summaries, cash-flow forecasts, funding commitments, liabilities and material expenditure records.",
      "No party should conceal material Company liabilities or funding commitments from the other where disclosure is required for proper governance.",
    ],
  },
  {
    number: "13",
    title: "Authority Matrix",
    bullets: [
      "Commercial Director: day-to-day commercial and operational execution within approved limits.",
      "CEO/shareholder: strategic direction, governance, shareholder matters and material corporate decisions.",
      "Borrowing and material financing: Company-level approval and documentation required.",
      "Payroll: Company payroll process and appropriate executive/corporate approval.",
      "Dividends: lawful distributable profits and proper corporate approval required.",
      "Bank payment authority: written mandate; no unrestricted credential sharing is created.",
    ],
  },
  {
    number: "14",
    title: "Profit Share, Bonus & Dividends",
    bullets: [
      "Any 10% annual profit share must be calculated using a clearly defined accounting basis in the final remuneration schedule.",
      "Any 10%–15% bonus must be tied to written performance/EBITDA criteria if Option A is selected.",
      "Dividends are distributions from lawful distributable profits and are not guaranteed remuneration.",
      "Accounting and tax treatment should be confirmed by the Company's accountant/payroll adviser before implementation.",
    ],
  },
  {
    number: "15",
    title: "Governance & Compliance",
    bullets: [
      "All Company decisions should be documented where required by law, the articles or internal governance procedures.",
      "Material contracts, borrowing, guarantees, related-party transactions and significant long-term commitments should be approved through the appropriate corporate process.",
      "The parties should cooperate with accountants, payroll providers, HMRC, banks, auditors and professional advisers as required.",
      "Nothing in this Agreement authorises unlawful tax arrangements, false accounting or improper use of Company funds.",
    ],
  },
  {
    number: "16",
    title: "Confidentiality & Information Security",
    bullets: [
      "Company financials, customers, suppliers, rates, pricing, contracts, technology, strategy and credentials are confidential.",
      "Disclosure is permitted where required by law or to authorised professional advisers, banks, accountants or regulators.",
      "Bank authentication information must be protected and handled according to the bank's security requirements.",
    ],
  },
  {
    number: "17",
    title: "Dispute & Escalation",
    bullets: [
      "Any disagreement should first be raised in writing with the specific issue and proposed resolution.",
      "The parties should attempt good-faith resolution before taking irreversible action.",
      "If unresolved, independent professional/legal advice should be obtained.",
      "This does not prevent compliance with statutory deadlines or urgent legal remedies.",
    ],
  },
  {
    number: "18",
    title: "Term & Amendment",
    bullets: [
      "This Agreement becomes effective only after appropriate corporate approval and execution.",
      "Amendments must be in writing and approved by the persons/entities required by the Company's constitutional and governance arrangements.",
      "The funding and personal-liability protection provisions should not be removed or diluted without an express written amendment.",
    ],
  },
  {
    number: "19",
    title: "Order of Precedence",
    bullets: [
      "Mandatory law and the Company's constitutional documents prevail where required.",
      "Detailed employment/service agreements, board resolutions and remuneration schedules should implement rather than silently contradict this Agreement.",
      "Where a later document changes remuneration or funding arrangements, the change should be explicit and signed.",
    ],
  },
];

export const EXECUTIVE_AGREEMENT_SCHEDULES = [
  {
    id: "A",
    title: "Schedule A — Final Commercial Terms",
    fields: [
      { label: "Selected CEO remuneration option", value: "A / B / C: ______________________________" },
      { label: "CEO base salary", value: "£________________ per annum" },
      { label: "Commercial Director remuneration", value: "£________________ per annum / other: __________________" },
      { label: "Bonus / profit share", value: "____________________________________________" },
      { label: "Dividend arrangement", value: "____________________________________________" },
      { label: "Salary commencement date", value: "____ / ____ / 2026" },
      { label: "Payroll frequency", value: "Monthly / other: ____________________________" },
      { label: "Funding facility / mechanism", value: "Company-level commercial funding / facility arranged through Company processes" },
      { label: "Personal guarantee from Khalid", value: "NONE unless separately agreed and signed" },
    ],
  },
  {
    id: "B",
    title: "Schedule B — Funding Protocol",
    bullets: [
      "Trigger: actual or anticipated Company cash-flow shortfall affecting approved payroll or essential operations.",
      "Commercial Director identifies and pursues Company-level funding.",
      "Possible mechanisms: corporate revolving credit, commercial debt, invoice discounting, working-capital facility or another approved corporate facility.",
      "Funding remains a Company obligation; Khalid has no personal funding obligation under this Agreement.",
      "Any personal guarantee or security must be separately disclosed and expressly signed.",
      "Facility amount, lender, interest, fees, security, term and repayment schedule should be inserted once established.",
      "Cash-flow forecasting should identify funding requirements before payroll becomes due.",
    ],
  },
  {
    id: "C",
    title: "Schedule C — Core Acknowledgements",
    bullets: [
      "Khalid Mehmood is CEO and shareholder.",
      "Alastair is Commercial Director.",
      "Commercial and operational leadership is delegated to Alastair within written limits.",
      "Company-level commercial funding is the agreed mechanism for payroll/working-capital shortfalls.",
      "Khalid is not required to provide shareholder loans or personal capital for Company shortfalls.",
      "No personal guarantee is implied.",
      "Financial information and bank authority are handled through controlled corporate processes.",
      "The selected remuneration option and exact salary terms must be completed before implementation.",
    ],
  },
  {
    id: "D",
    title: "Schedule D — Signature & Execution",
    body: [
      "This draft should not be signed until the blank commercial terms are completed and the document has been reviewed by an appropriate UK professional.",
    ],
    signatures: [
      { party: "Khalid Mehmood — CEO & Shareholder", lines: ["Signature: __________________________", "Date: ____ / ____ / 2026", "Selected Option: A / B / C: __________", "Company approval/reference: __________"] },
      { party: "Alastair — Commercial Director", lines: ["Signature: __________________________", "Date: ____ / ____ / 2026", "Approved / Confirmed: ______________", "Company approval/reference: __________"] },
    ],
  },
] as const;
