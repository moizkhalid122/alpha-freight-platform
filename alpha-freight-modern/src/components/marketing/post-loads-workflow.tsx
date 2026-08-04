import {
  CircleCheck,
  FileUp,
  Scale,
  UserPlus,
} from "lucide-react";

import PremiumWorkflowSteps from "@/components/marketing/PremiumWorkflowSteps";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create your account",
    detail: "Free supplier signup — company details, contacts, and payment preferences in one flow.",
    timing: "~3 min setup",
  },
  {
    step: "02",
    icon: FileUp,
    title: "Publish your load",
    detail: "Route, cargo, equipment, timing, and budget. Most loads go live in under two minutes.",
    timing: "Under 2 min",
  },
  {
    step: "03",
    icon: Scale,
    title: "Review carrier bids",
    detail: "Compare verified hauliers by price, rating, and lane fit — award the best match.",
    timing: "Bids in hours",
  },
  {
    step: "04",
    icon: CircleCheck,
    title: "Track & close with POD",
    detail: "Live milestones, digital proof of delivery, and pay instant or pay later.",
    timing: "End-to-end",
  },
];

export function PostLoadsWorkflowSection() {
  return (
    <PremiumWorkflowSteps
      eyebrow="Workflow"
      title={
        <>
          How to post freight loads
          <br />
          <span className="text-slate-400">with Alpha Freight</span>
        </>
      }
      subtitle="Four steps from signup to POD — built for UK suppliers who need speed and control."
      steps={steps}
    />
  );
}
