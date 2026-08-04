export type TrainingLesson = {
  id: string;
  title: string;
  summary: string;
  durationMin?: number;
};

export type TrainingSection = {
  id: string;
  title: string;
  icon: "welcome" | "company" | "sales" | "product" | "scripts" | "knowledge";
  lessons: TrainingLesson[];
};

export const EMPLOYEE_TRAINING_CATALOG: TrainingSection[] = [
  {
    id: "welcome",
    title: "Welcome",
    icon: "welcome",
    lessons: [
      {
        id: "welcome-intro",
        title: "Welcome to Alpha Freight",
        summary: "Your role, daily workflow, and how the employee hub fits together.",
        durationMin: 10,
      },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: "company",
    lessons: [
      { id: "about", title: "About Alpha Freight", summary: "Who we are and how we operate in UK freight.", durationMin: 8 },
      { id: "vision", title: "Vision", summary: "Where Alpha Freight is heading over the next 3–5 years.", durationMin: 5 },
      { id: "mission", title: "Mission", summary: "Our promise to carriers, suppliers, and customers.", durationMin: 5 },
      { id: "services", title: "Services", summary: "Full breakdown of carrier, supplier, and platform services.", durationMin: 12 },
    ],
  },
  {
    id: "sales",
    title: "Sales Training",
    icon: "sales",
    lessons: [
      { id: "cold-calling", title: "Cold Calling", summary: "Opening scripts, gatekeepers, and first-call structure.", durationMin: 20 },
      { id: "objections", title: "Handling Objections", summary: "Price, timing, and competitor responses.", durationMin: 15 },
      { id: "closing", title: "Closing Deals", summary: "Trial closes, next steps, and handover to operations.", durationMin: 15 },
      { id: "relationships", title: "Building Relationships", summary: "Follow-up cadence and long-term account growth.", durationMin: 12 },
    ],
  },
  {
    id: "product",
    title: "Product Training",
    icon: "product",
    lessons: [
      { id: "carrier-services", title: "Carrier Services", summary: "Loads, bidding, verification, and payouts.", durationMin: 18 },
      { id: "supplier-services", title: "Supplier Services", summary: "Posting loads, tracking, pay-later, and instant pay.", durationMin: 18 },
      { id: "platform-demo", title: "Platform Demo", summary: "Walkthrough of carrier and supplier dashboards.", durationMin: 25 },
      { id: "pricing", title: "Pricing", summary: "How we price lanes, margins, and commission.", durationMin: 12 },
    ],
  },
  {
    id: "scripts",
    title: "Scripts",
    icon: "scripts",
    lessons: [
      { id: "carrier-script", title: "Carrier Calling Script", summary: "Standard outbound call flow for carriers.", durationMin: 10 },
      { id: "supplier-script", title: "Supplier Calling Script", summary: "Standard outbound call flow for suppliers.", durationMin: 10 },
      { id: "email-templates", title: "Email Templates", summary: "Intro, follow-up, and proposal templates.", durationMin: 8 },
      { id: "linkedin-templates", title: "LinkedIn Templates", summary: "Connection requests and follow-up messages.", durationMin: 8 },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    icon: "knowledge",
    lessons: [
      { id: "faqs", title: "FAQs", summary: "Common carrier and supplier questions with approved answers.", durationMin: 15 },
      { id: "documents", title: "Documents", summary: "Handbook, contracts, and compliance docs.", durationMin: 10 },
      { id: "policies", title: "Policies", summary: "HR, conduct, and data protection policies.", durationMin: 12 },
      { id: "commission-rules", title: "Commission Rules", summary: "How commission is calculated, approved, and paid.", durationMin: 10 },
    ],
  },
];

const PROGRESS_KEY = "af_training_progress";

export function getTrainingProgress(userId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(`${PROGRESS_KEY}_${userId}`) || "{}");
  } catch {
    return {};
  }
}

export function setTrainingLessonComplete(userId: string, lessonId: string, done: boolean) {
  if (typeof window === "undefined") return;
  const current = getTrainingProgress(userId);
  if (done) current[lessonId] = true;
  else delete current[lessonId];
  localStorage.setItem(`${PROGRESS_KEY}_${userId}`, JSON.stringify(current));
}

export function trainingProgressPct(userId: string): number {
  const all = EMPLOYEE_TRAINING_CATALOG.flatMap((s) => s.lessons);
  if (!all.length) return 0;
  const done = getTrainingProgress(userId);
  const completed = all.filter((l) => done[l.id]).length;
  return Math.round((completed / all.length) * 100);
}
