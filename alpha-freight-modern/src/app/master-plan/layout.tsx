import type { Metadata } from "next";
import type { ReactNode } from "react";

import { planFontClassName } from "@/lib/revenue-plan-fonts";

import "../revenue-model/revenue-plan-print.css";
import "../revenue-model/revenue-plan.css";

export const metadata: Metadata = {
  title: "Master Plan Part 1 | Alpha Freight",
  robots: { index: false, follow: false },
};

export default function MasterPlanLayout({ children }: { children: ReactNode }) {
  return <div className={planFontClassName}>{children}</div>;
}
