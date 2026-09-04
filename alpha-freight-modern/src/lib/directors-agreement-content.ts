export const DIRECTORS_AGREEMENT_META = {
  company: "Alpha Freight Solutions Limited",
  companyNumber: "16860760",
  registeredOffice: "124–128 City Road, London, England, EC1V 2NX",
  title: "Final Directors, Executive Remuneration, Governance & UK Operating Agreement",
  effectiveDate: "24 August 2026",
  governingLaw: "England and Wales",
  docRef: "AF-DIR-FINAL-2026",
  confidential: "Confidential — For the parties and their professional advisers",
  legalNotice:
    "Comprehensive commercial draft based on the terms and source documents supplied by the parties. Review by a qualified England and Wales solicitor and accountant is recommended before signature. This document cannot override mandatory law, the Company's Articles of Association, HMRC requirements or binding lender terms.",
  parties: [
    {
      role: "CEO / Director / Shareholder",
      name: "Khalid Mehmood",
      detail: "Chief Executive Officer, Director and Shareholder",
    },
    {
      role: "Commercial Director / Director of Operations",
      name: "Alastair James Massey",
      detail: "Commercial Director and Director of Operations",
    },
  ],
};

export const DIRECTORS_AGREEMENT_SUMMARY = [
  { item: "Effective Date", value: "24 August 2026" },
  { item: "CEO / Director / Shareholder", value: "Khalid Mehmood" },
  { item: "Commercial Director / Director of Operations", value: "Alastair James Massey" },
  { item: "CEO Base Salary", value: "£110,000 gross per annum" },
  { item: "CEO Performance Bonus", value: "10% of base salary (£11,000 target)" },
  { item: "CEO NBI Commission", value: "10%–15%" },
  { item: "Commercial Director Base Salary", value: "£100,000 gross per annum" },
  { item: "Commercial Director Performance Bonus", value: "10% of base salary (£10,000 target)" },
  { item: "Commercial Director NBI Commission", value: "10%–15%" },
  { item: "Annual Leave (each executive director)", value: "28 days paid per annum" },
  { item: "Sick Pay", value: "SSP where eligible + Company sick-pay arrangements" },
  { item: "Commercial Director — funding & salary", value: "Responsible for company funding and timely salary payments" },
  { item: "CEO — personal funding", value: "Not required; no personal liability for CD funding/loans" },
  { item: "Personal loan compensation (example)", value: "£20,000 loan → £1,000/month until repaid (if agreed in writing)" },
  { item: "Commercial Director — Companies House", value: "Recorded as Director; Commercial Director is internal title" },
  { item: "Governing Law", value: "England and Wales" },
] as const;

export type AgreementClause = {
  number: number;
  title: string;
  body?: string[];
  bullets?: string[];
  subsections?: { heading: string; bullets: string[] }[];
  callout?: string;
  table?: { headers: string[]; rows: string[][] };
};

export const DIRECTORS_AGREEMENT_CLAUSES: AgreementClause[] = [
  {
    number: 1,
    title: "Parties and Purpose",
    body: [
      'This Agreement is made on 24 August 2026 between Alpha Freight Solutions Limited, company number 16860760, registered office 124–128 City Road, London, England, EC1V 2NX (the "Company"); Khalid Mehmood, Chief Executive Officer, Director and Shareholder (the "CEO"); and Alastair James Massey, Commercial Director and Director of Operations (the "Commercial Director").',
      "It records the agreed executive roles, remuneration, UK operating framework, governance arrangements, funding responsibilities and related protections.",
    ],
  },
  {
    number: 2,
    title: "Final Remuneration Position",
    body: [
      "The parties expressly agree that the CEO's final annual base salary is £110,000 gross per annum. Any earlier draft figure inconsistent with £110,000 is superseded and shall not be used to reduce or reinterpret the CEO's agreed salary.",
      "The parties expressly agree that the Commercial Director's final annual base salary is £100,000 gross per annum. Any earlier draft figure inconsistent with £100,000 is superseded and shall not be used to reduce or reinterpret the Commercial Director's agreed salary.",
    ],
  },
  {
    number: 3,
    title: "CEO Role and Responsibilities",
    bullets: [
      "Overall strategic and executive leadership.",
      "Corporate strategy, long-term planning and major commercial decisions.",
      "Strategic customer, partner and executive relationships.",
      "Oversight of Company performance and major funding strategy.",
      "Strategic oversight of the UK operating structure.",
      "Protection of the Company's reputation, compliance culture and long-term interests.",
    ],
    callout:
      "The CEO may perform strategic and executive activities while physically based in Pakistan. This clause does not determine tax residence, UK tax exposure, permanent establishment or management-and-control consequences; those matters require appropriate professional advice.",
  },
  {
    number: 4,
    title: "Commercial Director / UK Operations",
    bullets: [
      "Lead UK commercial growth, sales and broker targets.",
      "Manage UK customer and supplier relationships, pricing and commercial strategy within approved authority.",
      "Lead UK operational execution, freight dispatch and related workflows.",
      "Coordinate UK staff, contractors and operational service providers.",
      "Support UK banking, operating expenditure and payroll processes within approved authority.",
      "Lead or coordinate approaches to prospective commercial funding providers.",
      "Provide accurate Company information for lender due diligence.",
    ],
    callout:
      "The parties intend the Company to maintain genuine UK commercial and operational activity. No party shall misrepresent the location of activities to HMRC, Companies House, lenders, banks, customers, suppliers or other authorities.",
  },
  {
    number: 5,
    title: "Director Duties and Governance",
    body: [
      "Each director remains subject to the Companies Act 2006, the Company's Articles of Association and applicable law. This Agreement does not remove or transfer statutory duties. Each director must act within the Company's constitution, promote the Company's success, exercise independent judgement, use reasonable care, skill and diligence, manage conflicts and declare relevant interests.",
      "Where a matter requires a board resolution, shareholder resolution, statutory filing or other corporate formality, that formality shall be completed separately.",
    ],
  },
  {
    number: 6,
    title: "CEO Base Salary",
    bullets: [
      "The Company shall pay the CEO a gross annual base salary of £110,000.",
      "The indicative gross monthly equivalent is £9,166.67, subject to payroll reconciliation.",
      "Salary shall be processed through lawful payroll arrangements and subject to applicable PAYE, National Insurance, pension obligations and other statutory deductions or employer liabilities where applicable.",
    ],
  },
  {
    number: 7,
    title: "CEO Performance Bonus",
    bullets: [
      "The CEO shall be eligible for an annual performance bonus equal to 10% of annual base salary, subject to performance assessment and applicable payroll/tax treatment.",
      "At a £110,000 base salary, the target 10% annual bonus is £11,000.",
      "Performance may consider Company growth, strategic delivery, customer development, operational governance, funding progress and other reasonable CEO objectives agreed for the relevant period.",
    ],
  },
  {
    number: 8,
    title: "CEO NBI Commission",
    bullets: [
      'The CEO shall be entitled to commission of 10%–15% of Net Brokerage Income ("NBI"), with the applicable rate for each relevant period recorded in writing.',
      "For this Agreement, NBI means brokerage income recognised by the Company after properly recorded customer credits, refunds, reversals and other direct reductions attributable to that brokerage income. The Company's accounting records are the primary record of NBI.",
      "Commission shall be calculated on income received and recorded by the Company unless otherwise agreed in writing. The Company shall provide a reasonable calculation statement showing the relevant NBI, rate and commission.",
      "If no higher rate is separately confirmed in writing, the default rate within the agreed range shall be 10%.",
    ],
  },
  {
    number: 9,
    title: "Commercial Director Base Salary",
    bullets: [
      "The Company shall pay the Commercial Director a gross annual base salary of £100,000.",
      "The indicative gross monthly equivalent is £8,333.33, subject to payroll reconciliation.",
      "Salary shall be processed through lawful payroll arrangements and subject to applicable PAYE, National Insurance, pension obligations and other statutory deductions or employer liabilities where applicable.",
    ],
  },
  {
    number: 10,
    title: "Commercial Director Performance Bonus",
    bullets: [
      "The Commercial Director shall be eligible for an annual performance bonus equal to 10% of annual base salary, subject to performance assessment and applicable payroll/tax treatment.",
      "At a £100,000 base salary, the target 10% annual bonus is £10,000.",
      "Performance may consider UK commercial growth, sales and broker targets, customer development, operational delivery, funding coordination and other reasonable Commercial Director objectives agreed for the relevant period.",
    ],
  },
  {
    number: 11,
    title: "Commercial Director NBI Commission",
    bullets: [
      'The Commercial Director shall be entitled to commission of 10%–15% of Net Brokerage Income ("NBI"), with the applicable rate for each relevant period recorded in writing.',
      "NBI shall be calculated in accordance with Clause 8. Commission shall be calculated on income received and recorded by the Company unless otherwise agreed in writing. The Company shall provide a reasonable calculation statement showing the relevant NBI, rate and commission.",
      "If no higher rate is separately confirmed in writing, the default rate within the agreed range shall be 10%.",
    ],
  },
  {
    number: 12,
    title: "Annual Leave and Sick Pay",
    bullets: [
      "Each executive director shall be entitled to 28 days paid annual leave per annum, subject to reasonable business notice, approval and cover arrangements.",
      "Annual leave shall be recorded and processed through lawful payroll or HR arrangements. Unused leave shall be handled in accordance with applicable law, payroll policy and any written agreement for the relevant period.",
      "Where an executive director is unable to work due to illness or injury, the Company shall apply sick pay in accordance with applicable UK law (including Statutory Sick Pay where eligible) and the Company's sick-pay and payroll arrangements.",
      "The executive director shall notify the Company promptly of absence due to illness and provide reasonable supporting information or certification where required.",
      "Nothing in this clause reduces any mandatory statutory entitlement.",
    ],
  },
  {
    number: 13,
    title: "Payroll and Statutory Deductions",
    body: [
      "The parties acknowledge that director remuneration may be subject to PAYE and National Insurance. The Company shall use appropriate payroll/accounting support and report remuneration as required by law. Nothing in this Agreement promises a tax-free salary or a particular personal tax result.",
    ],
  },
  {
    number: 14,
    title: "Commercial Funding Framework",
    body: [
      "The parties have reviewed a proposed commercial funding framework involving invoice finance/discounting, asset finance and revolving credit/liquidity facilities. The framework is a proposal and is not itself binding lender approval.",
    ],
    bullets: [
      "Invoice finance / invoice discounting / factoring against eligible receivables.",
      "Hire purchase and operating lease facilities for operational assets.",
      "Revolving credit or other working-capital facilities.",
      "Other lawful commercial facilities suitable for the Company.",
      "The Commercial Director shall lead or coordinate approaches to prospective funders, while major funding commitments remain subject to Company authority and any required board approval.",
    ],
  },
  {
    number: 15,
    title: "Commercial Director — Funding and Salary Responsibilities",
    subsections: [
      {
        heading: "Commercial funding responsibility",
        bullets: [
          "The Commercial Director shall be responsible for coordinating and arranging the required commercial funding for the Company and ensuring that the Company has sufficient funds available to meet its agreed financial obligations.",
        ],
      },
      {
        heading: "Salary funding",
        bullets: [
          "The Commercial Director shall be responsible for ensuring that sufficient funds are available in the Company's account to pay all agreed salaries and remuneration payments on time.",
        ],
      },
      {
        heading: "If commercial funding is delayed or declined",
        bullets: [
          "If the Company's commercial funding is delayed or declined due to the Company's credit, eligibility or financial position, the Commercial Director shall be responsible for arranging an appropriate alternative Company-level funding solution to ensure that agreed salaries and necessary Company expenses can still be paid.",
        ],
      },
      {
        heading: "If Company revenue is insufficient",
        bullets: [
          "If the Company's ordinary revenue is insufficient in any month to meet its salaries, agreed additional remuneration and necessary Company expenses, the Commercial Director shall be responsible for ensuring that sufficient funds are made available through an appropriate Company-level funding arrangement.",
        ],
      },
    ],
  },
  {
    number: 16,
    title: "No Personal Funding Required From CEO",
    bullets: [
      "The CEO shall not be required to provide personal funds, personal borrowing, a personal guarantee or any personal financial support to meet the Company's funding requirements or salary obligations.",
      "Nothing in this Agreement shall create any personal liability, personal guarantee or obligation on the part of the CEO in respect of any loan, borrowing or funding arranged by the Commercial Director.",
    ],
  },
  {
    number: 17,
    title: "Personal Loan Compensation Arrangements",
    subsections: [
      {
        heading: "Personal loan taken by Commercial Director",
        bullets: [
          "If the Commercial Director obtains a personal loan in his own name for the purpose of providing funding to the Company, the loan shall remain his personal financial responsibility. The Company shall not be liable to the lender for the personal loan itself.",
        ],
      },
      {
        heading: "Compensation / additional remuneration",
        bullets: [
          "Where the Commercial Director obtains personal borrowing to provide funding for the Company, the Company shall compensate the Commercial Director through an agreed additional remuneration or pay rise, the amount of which shall be agreed in writing based on the amount and duration of the loan.",
          "The additional remuneration shall continue only until the relevant personal loan has been fully repaid. Once the loan has been fully repaid, the additional remuneration shall cease.",
          "The agreed additional remuneration shall be intended to cover the repayment of the relevant loan, including applicable loan interest and charges, as agreed between the parties.",
        ],
      },
      {
        heading: "Example — £20,000 personal loan",
        bullets: [
          "For example, in the event that the Commercial Director obtains a £20,000 personal loan to provide funding to the Company, the agreed additional remuneration would be £1,000 per month until the loan has been fully repaid, subject to the agreed loan terms and applicable payroll/tax treatment.",
        ],
      },
    ],
    callout:
      "Any personal loan arrangement and corresponding additional remuneration must be documented in writing, processed lawfully through payroll or accounting arrangements and reviewed for tax, NI and director-loan compliance before implementation.",
  },
  {
    number: 18,
    title: "Commercial Director — Companies House Appointment",
    body: [
      'The Commercial Director shall be appointed as a Director of the Company and shall be recorded as a Director with Companies House. The title "Commercial Director" describes his specific role and responsibilities within the Company; Companies House shall record him as a Director.',
    ],
  },
  {
    number: 19,
    title: "Funding Term Sheet",
    body: ["Before the Company becomes bound by a funding facility, the parties shall obtain and review the lender's formal term sheet, offer letter and final facility agreement where applicable."],
    bullets: [
      "Facility limit and borrowing base.",
      "Interest/discount rate.",
      "Fees and charges.",
      "Repayment mechanics.",
      "Security and charges.",
      "Personal Guarantee requirements.",
      "Covenants and reporting.",
      "Default and termination provisions.",
    ],
    callout: "No funding amount, interest rate, approval or facility limit is guaranteed by this Agreement.",
  },
  {
    number: 20,
    title: "Bank Statements and Credit Checks",
    body: [
      "The parties have confirmed a six-month bank-statement requirement for the prospective funding process.",
      "The parties have specifically discussed that Alpha Freight currently has a low bank balance and that the account has previously reached approximately negative £12. The Commercial Director has confirmed that the low balance itself will not automatically cause the application to be rejected. This is an internal confirmation only and does not bind a lender or override lender underwriting.",
      "A prospective lender may use Experian, CreditSafe, Equifax or another provider. The exact provider and threshold are to be confirmed by the lender.",
    ],
    bullets: [
      "Company credit profile and trade-credit history.",
      "Companies House information and filing history.",
      "CCJs or other adverse public information where relevant.",
      "Banking activity and cash-flow behaviour.",
      "Invoices, contracts and eligible receivables.",
      "Customer/debtor information.",
      "Directorship/company history.",
      "The lender's own eligibility criteria.",
    ],
    callout: "All information supplied to lenders must be accurate. No party shall fabricate, conceal or alter documents.",
  },
  {
    number: 21,
    title: "Personal Guarantee",
    bullets: [
      "The Commercial Director has confirmed that no Personal Guarantee is currently required under the proposed arrangement from the CEO. This does not prevent a future lender from separately requesting a guarantee. No director is deemed to have provided a Personal Guarantee merely by signing this Agreement.",
      "Any future Personal Guarantee must be separately reviewed and signed by the relevant individual.",
    ],
  },
  {
    number: 22,
    title: "Banking and Cash Controls",
    bullets: [
      "Company revenue shall be collected through Company-controlled accounts.",
      "Company payroll and legitimate operating expenses shall be paid through appropriate Company accounts.",
      "Material payments shall follow the Company's authorised approval process.",
      "Bank credentials shall be protected and not shared improperly.",
      "Company money shall not be used for personal purposes except for properly authorised remuneration, dividends, expenses or other lawful payments.",
      "Related-party transactions shall be disclosed and handled in accordance with applicable law.",
    ],
  },
  {
    number: 23,
    title: "UK Operations and Staff",
    bullets: [
      "The Company may maintain UK commercial and operational staff, including commercial/brokerage personnel, freight coordinators, compliance/administration personnel and other operational roles as required.",
      "UK employees and directors shall be placed on appropriate payroll or contractual arrangements. The Company shall maintain appropriate RTI/PAYE/National Insurance processes where required.",
      "The Commercial Director shall coordinate UK operational staffing and workflows within approved budgets and authority.",
    ],
  },
  {
    number: 24,
    title: "Tax, Cross-Border Working and Compliance",
    bullets: [
      "The parties acknowledge that the CEO may be based in Pakistan while the Company maintains UK operations. This Agreement does not determine tax residence, permanent establishment, management-and-control, withholding or other tax outcomes.",
      "The Company shall obtain appropriate UK and, where relevant, Pakistan professional advice regarding cross-border remuneration and operations.",
      "No party shall make a misleading statement to HMRC, the Federal Board of Revenue, Companies House, a lender, bank, customer or supplier.",
    ],
  },
  {
    number: 25,
    title: "Authority Matrix",
    table: {
      headers: ["Matter", "Primary Lead", "Control"],
      rows: [
        ["Corporate strategy", "CEO", "Board/constitutional approval where required"],
        ["UK commercial operations", "Commercial Director", "Approved budgets and reporting"],
        ["Commercial funding and salary funding", "Commercial Director", "Company authority; board approval where required"],
        ["Major funding", "CEO + Commercial Director", "Board approval where required; lender documents"],
        ["CEO remuneration", "Company/Board", "Written agreement + payroll"],
        ["Commercial Director remuneration", "Company/Board", "Written agreement + payroll"],
        ["Material contracts", "Relevant director", "Authority matrix / required approval"],
        ["Banking/material payments", "Authorised directors", "Bank mandate and internal controls"],
      ],
    },
  },
  {
    number: 26,
    title: "Confidentiality",
    bullets: [
      "Each party shall keep confidential all non-public Company information including customer and supplier information, pricing, funding, financial information, technology, contracts, business plans, credentials and personal data.",
      "Disclosure is permitted where required by law or reasonably necessary to professional advisers, authorised employees, funders or regulators, subject to appropriate confidentiality.",
    ],
  },
  {
    number: 27,
    title: "Intellectual Property and Company Property",
    bullets: [
      "Company materials, business data, customer lists, documents, software credentials and other Company property remain Company property.",
      "To the extent legally capable of assignment, intellectual property created specifically for the Company in the course of duties shall belong to the Company, subject to any pre-existing rights properly disclosed.",
      "On termination, Company property and confidential information shall be returned or securely dealt with, subject to lawful record-retention requirements.",
    ],
  },
  {
    number: 28,
    title: "Conflicts of Interest",
    body: [
      "Each director shall disclose actual or potential conflicts and comply with applicable law and Company procedures. No director shall misuse Company property, confidential information or business opportunities for personal benefit in breach of applicable duties.",
    ],
  },
  {
    number: 29,
    title: "Expenses and Benefits",
    body: [
      "Reasonable business expenses properly incurred for Company purposes may be reimbursed subject to receipts and approval. Any additional executive benefit or remuneration must be documented in writing.",
    ],
  },
  {
    number: 30,
    title: "Records and Audit Trail",
    bullets: [
      "Maintain accounting and corporate records.",
      "Retain lender correspondence and funding applications.",
      "Retain material customer and supplier contracts.",
      "Maintain payroll and remuneration records.",
      "Cooperate with accountants, auditors, tax advisers and lawyers.",
      "Do not knowingly destroy or alter records required for legal, tax, accounting or funding purposes.",
    ],
  },
  {
    number: 31,
    title: "Indemnity and Liability",
    bullets: [
      "Subject to the Companies Act 2006 and other mandatory law, the Company may indemnify a director to the extent legally permitted for liabilities properly incurred in lawful performance of duties.",
      "Nothing excludes liability for fraud, fraudulent misrepresentation, deliberate wrongdoing or any liability that cannot lawfully be excluded.",
      "A director is not personally responsible for Company debts merely by being a director, except where personal liability arises by law or the individual separately provides a valid personal undertaking or guarantee.",
    ],
  },
  {
    number: 32,
    title: "Insurance",
    body: [
      "The Company should consider appropriate directors' and officers' liability insurance and other business insurance. Actual coverage is governed by the relevant insurance policy.",
    ],
  },
  {
    number: 33,
    title: "Term and Termination",
    bullets: [
      "This Agreement begins on the Effective Date and continues until terminated or replaced by a later written agreement.",
      "Mutual written agreement.",
      "Lawful resignation or cessation of the relevant executive role.",
      "Lawful termination for cause or other lawful grounds.",
      "Removal or cessation of directorship in accordance with the Company's constitution and applicable law.",
      "Termination does not remove properly accrued salary, approved expenses or earned commission, subject to lawful deductions and the terms governing the relevant payment.",
    ],
  },
  {
    number: 34,
    title: "Handover and Post-Termination",
    bullets: [
      "Confidentiality obligations continue.",
      "Company property and information shall be returned or securely dealt with.",
      "Operational and financial handover shall be completed.",
      "Properly accrued remuneration shall be processed.",
      "Continuing obligations expressly stated to survive termination remain effective.",
    ],
  },
  {
    number: 35,
    title: "No Misrepresentation",
    body: [
      "The parties shall conduct Company affairs honestly and lawfully. No party shall knowingly provide false information concerning ownership, management, location of activities, customers, revenue, invoices, contracts, bank statements, credit information, funding purpose or tax position.",
    ],
  },
  {
    number: 36,
    title: "Data Protection",
    body: [
      "The parties shall process personal data only as reasonably necessary for Company operations, administration, compliance, accounting, funding and legal obligations, subject to applicable data-protection law.",
    ],
  },
  {
    number: 37,
    title: "Notices",
    body: [
      "Formal notices should be in writing and retained in Company records. Email may be used where appropriate, provided important corporate, remuneration or termination notices are clearly documented.",
    ],
  },
  {
    number: 38,
    title: "Dispute Resolution",
    body: [
      "The parties shall first attempt in good faith to resolve disputes through direct discussion. Where appropriate, they may use mediation before court proceedings, except where urgent legal relief is required.",
    ],
  },
  {
    number: 39,
    title: "Governing Law and Jurisdiction",
    body: [
      "This Agreement and any non-contractual obligations arising from it shall be governed by the law of England and Wales. Subject to any agreed mediation process, the courts of England and Wales shall have jurisdiction.",
    ],
  },
  {
    number: 40,
    title: "Entire Agreement and Previous Documents",
    body: [
      "This Agreement records the final agreed internal commercial and governance terms covered by it. Where an earlier PDF, proposal or informal message conflicts with this signed Agreement, this Agreement prevails between the parties, except that mandatory law, the Company's Articles of Association and binding third-party/lender documents continue to apply.",
      "The CEO's final agreed annual base salary is £110,000. The Commercial Director's final agreed annual base salary is £100,000. Any earlier inconsistent salary figures are expressly superseded.",
    ],
  },
  {
    number: 41,
    title: "Amendments",
    body: [
      "Any amendment must be in writing and properly approved. Changes to salary, bonus, NBI commission, executive roles, authority or funding obligations should be expressly documented.",
    ],
  },
  {
    number: 42,
    title: "Severability",
    body: [
      "If any provision is invalid or unenforceable, it shall be modified or severed only to the minimum extent necessary and the remaining provisions shall continue.",
    ],
  },
  {
    number: 43,
    title: "No Waiver",
    body: [
      "A delay or failure to exercise a right is not a waiver. A waiver must be express and in writing.",
    ],
  },
  {
    number: 44,
    title: "Counterparts and Electronic Signatures",
    body: [
      "This Agreement may be signed in counterparts. Electronic signatures may be used where legally effective and accepted by the parties and their advisers.",
    ],
  },
  {
    number: 45,
    title: "Professional Review",
    body: [
      "Because this Agreement covers director duties, executive remuneration (including £110,000 CEO base salary and £100,000 Commercial Director base salary), annual leave, sick pay, Commercial Director funding responsibilities, personal loan compensation arrangements, CEO personal-liability protections, cross-border working, payroll, tax and commercial funding, the Company should obtain review from a qualified England and Wales solicitor and accountant/payroll adviser before signature and implementation.",
    ],
  },
];

export const DIRECTORS_AGREEMENT_SCHEDULES = [
  {
    id: "1",
    title: "Schedule 1 — Final Commercial Terms",
    table: {
      headers: ["Item", "Final agreed position"],
      rows: [
        ["Company", "Alpha Freight Solutions Limited"],
        ["Company number", "16860760"],
        ["Registered office", "124–128 City Road, London, England, EC1V 2NX"],
        ["CEO", "Khalid Mehmood"],
        ["Commercial Director / Director of Operations", "Alastair James Massey"],
        ["CEO base salary", "£110,000 gross per annum"],
        ["CEO annual performance bonus", "10% of annual base salary (£11,000 target)"],
        ["CEO NBI commission", "10%–15%"],
        ["Commercial Director base salary", "£100,000 gross per annum"],
        ["Commercial Director annual performance bonus", "10% of annual base salary (£10,000 target)"],
        ["Commercial Director NBI commission", "10%–15%"],
        ["Annual leave (each executive director)", "28 days paid per annum"],
        ["Sick pay", "Statutory Sick Pay where eligible + Company sick-pay arrangements"],
        ["Commercial Director — funding & salary", "Responsible for coordinating company funding and timely salary payments"],
        ["CEO — personal funding", "Not required; no personal liability for Commercial Director funding/loans"],
        ["Personal loan compensation (example)", "£20,000 loan → £1,000/month until repaid (if agreed in writing)"],
        ["Commercial Director — Companies House", "Recorded as Director; Commercial Director is internal title"],
        ["CEO working location", "May perform strategic/executive activities from Pakistan, subject to law and advice"],
        ["UK operational leadership", "Commercial Director / Director of Operations"],
        ["Funding", "Proposed commercial funding; subject to lender approval"],
        ["Bank statements", "6 months"],
        ["Low balance", "Confirmed by Alastair not to automatically cause rejection; lender retains underwriting decision"],
        ["Credit checking", "Prospective lender may use Experian, CreditSafe, Equifax or another provider"],
        ["Personal Guarantee", "None currently agreed internally; lender may separately request one"],
        ["Governing law", "England and Wales"],
      ],
    },
  },
  {
    id: "2",
    title: "Schedule 2 — Funding Due-Diligence Checklist",
    bullets: [
      "Six months Company bank statements.",
      "Company credit information.",
      "Companies House information.",
      "Customer invoices/contracts supporting eligible receivables.",
      "Evidence of business activity.",
      "Funding amount and intended use.",
      "Lender term sheet/offer letter.",
      "Fees and interest/discount rate.",
      "Security/charges.",
      "Personal Guarantee requirements, if any.",
      "Repayment/default terms.",
      "Professional review before execution of material finance documents.",
    ],
  },
  {
    id: "3",
    title: "Schedule 3 — Signatures",
    body: [
      "By signing, the parties confirm that they have read and understood this Agreement, including the Commercial Director's funding and salary responsibilities, the CEO's protection from personal funding obligations, and the personal loan compensation example (£20,000 loan / £1,000 per month until repaid where agreed in writing). They further confirm the CEO's final agreed base salary is £110,000 gross per annum, together with the agreed 10% annual performance bonus, 10%–15% NBI commission and 28 days paid annual leave; and that the Commercial Director's final agreed base salary is £100,000 gross per annum, together with the agreed 10% annual performance bonus, 10%–15% NBI commission and 28 days paid annual leave — in each case subject to sick-pay arrangements and applicable law.",
    ],
    signatures: [
      {
        heading: "For Alpha Freight Solutions Limited",
        party: "Khalid Mehmood — Chief Executive Officer / Director / Shareholder",
      },
      {
        heading: "For Alpha Freight Solutions Limited",
        party: "Alastair James Massey — Commercial Director / Director of Operations",
      },
    ],
    confirmation:
      "The final CEO base salary recorded in this Agreement is £110,000 per annum and the final Commercial Director base salary is £100,000 per annum. Earlier inconsistent draft figures are superseded.",
  },
] as const;
