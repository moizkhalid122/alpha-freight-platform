export const COMPANY_LEGAL_NAME = "Alpha Freight Solutions Limited";

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
          `This Non-Disclosure Agreement ("Agreement") is entered into between ${COMPANY_LEGAL_NAME} ("the Company") and the individual accepting this Agreement ("Team Member").`,
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
          "Commission rates, payroll information, and team records",
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
          "Do not remove Company data when your engagement ends unless expressly authorised",
          "Report any suspected data breach or unauthorised disclosure immediately",
        ],
      },
      {
        heading: "4. Exceptions",
        paragraphs: [
          "This Agreement does not restrict information that is already public through no fault of yours, was lawfully known to you before joining the team, or must be disclosed by law or court order (provided you notify the Company where legally permitted).",
        ],
      },
      {
        heading: "5. Duration",
        paragraphs: [
          `Your confidentiality obligations continue during your engagement with ${COMPANY_LEGAL_NAME} and for 24 months after it ends, unless a longer period is required by law or a separate written agreement.`,
        ],
      },
      {
        heading: "6. Remedies",
        paragraphs: [
          "Unauthorised disclosure may result in disciplinary action, termination of your team engagement, and legal remedies including injunctive relief and recovery of losses caused by the breach.",
        ],
      },
    ],
  },
  employment: {
    id: "employment",
    title: "Founding Team Member Agreement",
    shortTitle: "Founding Team Member Agreement",
    summary: `Sets out your role, responsibilities, and standards as a founding team member of ${COMPANY_LEGAL_NAME}.`,
    lastUpdated: "1 August 2026",
    sections: [
      {
        heading: "1. Parties",
        paragraphs: [
          `This Founding Team Member Agreement ("Agreement") is entered into between ${COMPANY_LEGAL_NAME} ("the Company") and the individual accepting this Agreement ("Team Member").`,
          "By accepting this Agreement during onboarding, you confirm that you have read, understood, and agree to be bound by its terms.",
        ],
      },
      {
        heading: "2. Purpose of the Role",
        paragraphs: [
          `You are joining ${COMPANY_LEGAL_NAME} as a member of the founding team.`,
          "Your role and responsibilities will be assigned during onboarding and may be updated by the Company as business requirements change.",
          "You agree to perform your duties professionally, honestly, and in the best interests of the Company.",
        ],
      },
      {
        heading: "3. Performance-Based Engagement",
        paragraphs: [
          `At this stage, ${COMPANY_LEGAL_NAME} is an early-stage startup.`,
          "Your position is currently performance-based.",
          "Unless confirmed separately in writing by the Company, this position does not include a guaranteed salary.",
          "Compensation will be paid in accordance with the Company's Commission Policy.",
          "The Company intends to introduce salaried positions for high-performing team members as the business grows.",
        ],
      },
      {
        heading: "4. Responsibilities",
        paragraphs: ["As a Team Member you agree to:"],
        bullets: [
          "Represent the Company professionally",
          "Follow reasonable instructions from management",
          "Complete assigned tasks through the team dashboard",
          "Keep CRM records accurate and up to date",
          "Record calls, meetings and customer interactions honestly",
          "Maintain a professional standard when communicating with customers, carriers and suppliers",
          "Protect the Company's reputation at all times",
        ],
      },
      {
        heading: "5. Working Arrangements",
        paragraphs: [
          "Working hours will be agreed with management.",
          "You may work remotely unless instructed otherwise.",
          "You are responsible for maintaining a reliable internet connection and suitable working environment.",
        ],
      },
      {
        heading: "6. Company Systems",
        paragraphs: [
          "You agree to use Company systems only for authorised business purposes.",
          "This includes:",
          "Unauthorised access or misuse of Company systems is prohibited.",
        ],
        bullets: [
          "Team Dashboard",
          "CRM",
          "Company Email",
          "Training Portal",
          "Documents",
          "Customer Database",
          "Internal Communication Tools",
        ],
      },
      {
        heading: "7. Company Property",
        paragraphs: [
          `All Company property remains the exclusive property of ${COMPANY_LEGAL_NAME}, including:`,
          "You must return or permanently delete Company property immediately upon request or when your engagement ends.",
        ],
        bullets: [
          "Customer databases",
          "Supplier databases",
          "Carrier databases",
          "CRM records",
          "Sales pipelines",
          "Training materials",
          "Documents",
          "Company email accounts",
          "Passwords",
          "Software",
          "Internal procedures",
          "Marketing materials",
        ],
      },
      {
        heading: "8. Commission",
        paragraphs: [
          "Commission is governed separately under the Company's Commission Policy.",
          "Commission becomes payable only after:",
        ],
        bullets: [
          "the Company confirms the transaction,",
          "all required approvals have been completed, and",
          "payment conditions under the Commission Policy have been met.",
        ],
      },
      {
        heading: "9. Standards of Conduct",
        paragraphs: ["You agree to:"],
        bullets: [
          "Act honestly and professionally",
          "Treat colleagues, customers and partners respectfully",
          "Avoid discrimination, harassment or abusive behaviour",
          "Follow Company policies",
          "Comply with applicable laws",
        ],
      },
      {
        heading: "10. Confidential Information",
        paragraphs: [
          "You agree to comply with the Company's Non-Disclosure Agreement (NDA).",
          "Confidential information must never be shared without written permission.",
        ],
      },
      {
        heading: "11. Data Protection",
        paragraphs: [
          "You must handle all personal and business data responsibly.",
          "You must not:",
        ],
        bullets: [
          "Copy customer lists",
          "Sell Company information",
          "Share Company data with third parties",
          "Download Company information for personal use",
        ],
      },
      {
        heading: "12. Termination",
        paragraphs: [
          "Either party may end this engagement at any time by providing reasonable notice unless immediate termination is justified.",
          "The Company may immediately terminate this Agreement in cases including:",
          "Upon termination you must immediately stop using Company systems and return or permanently delete all Company information.",
        ],
        bullets: [
          "Fraud",
          "Theft",
          "Serious misconduct",
          "Breach of confidentiality",
          "Misuse of Company systems",
          "Dishonesty",
          "Bringing the Company into disrepute",
        ],
      },
      {
        heading: "13. Governing Law",
        paragraphs: [
          "This Agreement shall be governed by and interpreted in accordance with the laws of England and Wales.",
          "Any dispute arising under this Agreement shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
        ],
      },
      {
        heading: "14. Acceptance",
        paragraphs: [
          'By clicking "I Agree" during onboarding, you confirm that:',
        ],
        bullets: [
          "You have read and understood this Agreement",
          "The information provided during onboarding is accurate",
          "You agree to comply with this Agreement",
          "You agree to follow Company policies, including the NDA and Commission Policy",
        ],
      },
      {
        heading: "Electronic acceptance",
        paragraphs: ["Your electronic acceptance shall have the same effect as a handwritten signature."],
      },
    ],
  },
  commission: {
    id: "commission",
    title: "Commission Policy",
    shortTitle: "Commission Policy",
    summary: "Explains how commission is earned, approved and paid.",
    lastUpdated: "1 August 2026",
    sections: [
      {
        heading: "1. Eligibility",
        paragraphs: [
          `This Commission Policy applies to eligible Business Development Representatives, Sales Representatives, and other team members authorised by ${COMPANY_LEGAL_NAME}.`,
          "Your commission eligibility and commission structure will be shown in your team dashboard.",
        ],
      },
      {
        heading: "2. Commission Structure",
        paragraphs: [
          "Each team member's commission rate is determined by management and may vary depending on:",
          "Your current commission structure will always be displayed in your team dashboard.",
          "The Company reserves the right to update commission structures where necessary.",
        ],
        bullets: [
          "Customer type",
          "Service type",
          "Business agreement",
          "Sales campaign",
          "Performance level",
          "Special incentive programmes",
        ],
      },
      {
        heading: "3. How Commission is Earned",
        paragraphs: [
          "Commission is earned only when:",
          "Only approved deals are eligible for commission.",
        ],
        bullets: [
          "A lead is successfully converted into a confirmed customer.",
          "The deal has been verified by management.",
          "The CRM records are complete and accurate.",
          "The customer has fulfilled the agreed payment obligations (unless otherwise approved by management).",
        ],
      },
      {
        heading: "4. CRM Requirements",
        paragraphs: [
          "To qualify for commission you must accurately maintain CRM records, including:",
          "Incomplete or inaccurate CRM records may delay or prevent commission approval.",
        ],
        bullets: [
          "Lead information",
          "Call history",
          "Meeting notes",
          "Follow-up activity",
          "Customer communications",
          "Deal status",
        ],
      },
      {
        heading: "5. Approval Process",
        paragraphs: [
          "When a deal is marked as Won, it enters the Pending Commission stage.",
          "Management will review:",
          "Only authorised management may approve commission.",
          "Management reserves the right to adjust or reject commission where records are incomplete, inaccurate or inconsistent with Company policies.",
        ],
        bullets: [
          "CRM activity",
          "Deal value",
          "Customer verification",
          "Supporting notes",
          "Payment status",
        ],
      },
      {
        heading: "6. Payment Schedule",
        paragraphs: [
          "Approved commission is normally paid monthly to the bank account registered in your team profile.",
          "Payments are generally processed within 5–7 working days following the monthly approval cycle, subject to banking schedules and public holidays.",
        ],
      },
      {
        heading: "7. Commission Adjustments & Clawbacks",
        paragraphs: [
          "The Company may reduce or recover commission where:",
          "Any adjustment will appear in your team dashboard.",
        ],
        bullets: [
          "A customer fails to pay.",
          "A contract is cancelled.",
          "A payment is refunded.",
          "A deal is found to be fraudulent.",
          "A deal is reopened or reversed.",
          "Incorrect information was used to obtain commission.",
        ],
      },
      {
        heading: "8. Fraud & Misconduct",
        paragraphs: [
          "The following may result in immediate termination of your engagement and forfeiture of unpaid commission:",
          "The Company reserves the right to take legal action where appropriate.",
        ],
        bullets: [
          "Creating fake leads",
          "Duplicate deals",
          "False CRM records",
          "Falsifying customer information",
          "Misrepresenting sales activity",
          "Attempting to obtain commission dishonestly",
          "Collusion with customers or other team members",
        ],
      },
      {
        heading: "9. Taxes",
        paragraphs: [
          "Each team member is responsible for any personal tax obligations arising from commission payments unless otherwise required by applicable law.",
        ],
      },
      {
        heading: "10. Policy Changes",
        paragraphs: [
          `${COMPANY_LEGAL_NAME} reserves the right to amend this Commission Policy at any time.`,
          "Any changes will be communicated through the team dashboard and will apply from the effective date specified.",
        ],
      },
      {
        heading: "11. Disputes",
        paragraphs: [
          "Any commission query must be raised within 30 days of the relevant payment date.",
          "Supporting CRM records and documentation may be requested during the review process.",
          "Management's decision shall be final unless otherwise required by law.",
        ],
      },
      {
        heading: "12. Acceptance",
        paragraphs: ['By clicking "I Agree" during onboarding, you confirm that:'],
        bullets: [
          "You have read and understood this Commission Policy.",
          "You agree to comply with its terms.",
          "You understand that commission is subject to management approval, verified CRM activity and Company policies.",
          "You understand that commission is not guaranteed unless all approval requirements have been satisfied.",
        ],
      },
      {
        heading: "Electronic acceptance",
        paragraphs: [
          "Your electronic acceptance shall have the same legal effect as a handwritten signature.",
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
