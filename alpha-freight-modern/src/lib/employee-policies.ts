export type EmployeePolicyId = "nda" | "employment" | "commission";

export type EmployeePolicySection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type EmployeePolicyDocument = {
  id: EmployeePolicyId;
  title: string;
  shortTitle: string;
  summary: string;
  lastUpdated: string;
  sections: EmployeePolicySection[];
};

export const EMPLOYEE_POLICIES: Record<EmployeePolicyId, EmployeePolicyDocument> = {
  nda: {
    id: "nda",
    title: "Non-Disclosure Agreement (NDA)",
    shortTitle: "NDA",
    summary: "Protects confidential business, client, and operational information.",
    lastUpdated: "1 August 2026",
    sections: [
      {
        heading: "1. Parties",
        paragraphs: [
          "This Non-Disclosure Agreement (“Agreement”) is between Alpha Freight UK (“the Company”) and you as an employee, contractor, or team member (“you”).",
          "By accepting this Agreement during onboarding, you confirm that you have read, understood, and agree to be bound by its terms.",
        ],
      },
      {
        heading: "2. Confidential information",
        paragraphs: ["For the purposes of this Agreement, Confidential Information includes (without limitation):"],
        bullets: [
          "Customer and supplier names, contact details, pricing, and contract terms",
          "Load details, routes, margins, and commercial negotiations",
          "Internal CRM data, lead lists, call recordings, and sales pipelines",
          "Commission rates, payroll information, and HR records",
          "Software credentials, platform access, and internal processes",
          "Any information marked confidential or that a reasonable person would treat as confidential",
        ],
      },
      {
        heading: "3. Your obligations",
        paragraphs: [
          "You must use Confidential Information only for legitimate Company business and must not disclose it to any third party without prior written approval from the Company.",
          "You must take reasonable care to prevent unauthorised access, copying, or sharing of Company data, including on personal devices or messaging apps.",
        ],
        bullets: [
          "Do not share client or load information on social media or public channels",
          "Do not remove Company data when your role ends unless expressly authorised",
          "Report any suspected data breach or unauthorised disclosure immediately",
        ],
      },
      {
        heading: "4. Exceptions",
        paragraphs: [
          "This Agreement does not restrict information that is already public through no fault of yours, was lawfully known to you before employment, or must be disclosed by law or court order (provided you notify the Company where legally permitted).",
        ],
      },
      {
        heading: "5. Duration",
        paragraphs: [
          "Your confidentiality obligations continue during your engagement with Alpha Freight UK and for 24 months after it ends, unless a longer period is required by law or a separate written agreement.",
        ],
      },
      {
        heading: "6. Remedies",
        paragraphs: [
          "Unauthorised disclosure may result in disciplinary action, termination, and legal remedies including injunctive relief and recovery of losses caused by the breach.",
        ],
      },
    ],
  },
  employment: {
    id: "employment",
    title: "Employment Agreement",
    shortTitle: "Employment Agreement",
    summary: "Sets out your working relationship, responsibilities, and conduct standards with Alpha Freight UK.",
    lastUpdated: "1 August 2026",
    sections: [
      {
        heading: "1. Role and duties",
        paragraphs: [
          "You are engaged by Alpha Freight UK in the role assigned to you at onboarding (or as updated in writing by management).",
          "You agree to perform your duties diligently, follow reasonable instructions, and represent the Company professionally with customers, carriers, suppliers, and colleagues.",
        ],
      },
      {
        heading: "2. Probation and performance",
        paragraphs: [
          "Unless otherwise agreed in writing, a probationary period of up to 3 months applies. During probation, either party may end the engagement with one week’s notice.",
          "Ongoing employment may depend on satisfactory performance, attendance, compliance with Company policies, and achievement of reasonable KPIs set by your line manager.",
        ],
      },
      {
        heading: "3. Working hours and availability",
        paragraphs: [
          "Your standard working pattern will be agreed with management. You may be required to attend meetings, respond to urgent customer matters, and use the employee portal for tasks, leads, calls, and updates during agreed working hours.",
          "Remote or hybrid working may be permitted where appropriate, but you remain responsible for secure handling of Company systems and data.",
        ],
      },
      {
        heading: "4. Conduct and compliance",
        paragraphs: ["You must at all times:"],
        bullets: [
          "Comply with UK employment law, health and safety requirements, and Company policies",
          "Use Company systems only for authorised business purposes",
          "Avoid conflicts of interest and disclose any secondary employment if requested",
          "Treat colleagues, clients, and partners with respect and without discrimination or harassment",
        ],
      },
      {
        heading: "5. Data protection",
        paragraphs: [
          "You will handle personal data in line with UK GDPR and the Company’s privacy practices. You must not export, sell, or misuse contact or customer data obtained through your role.",
        ],
      },
      {
        heading: "6. Leave and absences",
        paragraphs: [
          "Annual leave and sickness absence must be requested and recorded through the employee portal where available. Unauthorised absence or repeated lateness may lead to disciplinary action.",
        ],
      },
      {
        heading: "7. Termination",
        paragraphs: [
          "After successful completion of probation, notice periods will be as stated in your written offer or contract (typically 2–4 weeks unless otherwise agreed).",
          "The Company may terminate employment immediately in cases of gross misconduct, including theft, fraud, serious breach of confidentiality, or violence.",
        ],
      },
      {
        heading: "8. Acceptance",
        paragraphs: [
          "By accepting this Agreement, you confirm that the role details, contact information, and documents submitted during onboarding are accurate and complete to the best of your knowledge.",
        ],
      },
    ],
  },
  commission: {
    id: "commission",
    title: "Commission Policy",
    shortTitle: "Commission Policy",
    summary: "Explains how sales commission is calculated, approved, and paid.",
    lastUpdated: "1 August 2026",
    sections: [
      {
        heading: "1. Eligibility",
        paragraphs: [
          "Commission applies to eligible sales and business-development roles as confirmed by management. Your assigned commission rate is shown on your employee profile and in the commission workspace.",
        ],
      },
      {
        heading: "2. How commission is earned",
        paragraphs: ["Commission is calculated on closed deal value when a lead is marked Won in the employee CRM, subject to management verification."],
        bullets: [
          "Default sales rate is 8% unless a different rate is set on your profile",
          "Commission is based on confirmed revenue or contract value, excluding VAT where applicable",
          "Cancelled, refunded, or fraudulent deals may result in commission reversal",
          "Split deals must be agreed in writing with management before payout",
        ],
      },
      {
        heading: "3. Approval process",
        paragraphs: [
          "New commission entries are created as Pending when a deal is marked Won. An authorised manager reviews the deal value, supporting notes, and CRM activity before approval.",
          "The Company may reject or adjust commission where records are incomplete, inaccurate, or inconsistent with agreed terms.",
        ],
      },
      {
        heading: "4. Payment schedule",
        paragraphs: [
          "Approved commissions are typically paid monthly to the bank account registered in your employee profile.",
          "Payouts usually arrive within 5–7 working days after month-end approval, subject to banking cut-off times and public holidays.",
        ],
      },
      {
        heading: "5. Clawback and adjustments",
        paragraphs: [
          "If a customer fails to pay, a contract is cancelled, or a deal is re-opened within 90 days of payout, the Company may offset the related commission from future earnings.",
        ],
      },
      {
        heading: "6. Disputes",
        paragraphs: [
          "Commission queries must be raised within 30 days of the payout date through your line manager or the HR admin team, with supporting CRM references.",
        ],
      },
      {
        heading: "7. Acceptance",
        paragraphs: [
          "By accepting this policy, you agree that commission is discretionary to the extent permitted by law and subject to verified CRM records and management approval.",
        ],
      },
    ],
  },
};

export const EMPLOYEE_POLICY_LIST = Object.values(EMPLOYEE_POLICIES);

export function getEmployeePolicy(id: string): EmployeePolicyDocument | null {
  if (id in EMPLOYEE_POLICIES) {
    return EMPLOYEE_POLICIES[id as EmployeePolicyId];
  }
  return null;
}
