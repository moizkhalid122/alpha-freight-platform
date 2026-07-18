import {
  CircleCheck,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import PremiumWorkflowSteps from "@/components/marketing/PremiumWorkflowSteps";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create carrier account",
    detail: "Free signup — company details, fleet profile, and operating regions in one flow.",
    timing: "~5 min setup",
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Verify your fleet",
    detail: "Upload documents, insurance, and vehicle details to unlock premium UK freight loads.",
    timing: "Same-day review",
  },
  {
    step: "03",
    icon: Search,
    title: "Browse & bid live",
    detail: "Filter by route, equipment, and timing — submit competitive bids on lane-fit jobs.",
    timing: "Live board",
  },
  {
    step: "04",
    icon: CircleCheck,
    title: "Deliver & get paid",
    detail: "Upload digital POD, track milestones, and receive carrier payout within 7 days.",
    timing: "7-day payout",
  },
];

export function FindLoadsWorkflowSection() {
  return (
    <PremiumWorkflowSteps
      eyebrow="Workflow"
      title={
        <>
          How to find loads online
          <br />
          <span className="text-slate-400">with Alpha Freight</span>
        </>
      }
      subtitle="Four steps from signup to payout — built for UK carriers who want consistent lane-fit freight."
      steps={steps}
    />
  );
}
