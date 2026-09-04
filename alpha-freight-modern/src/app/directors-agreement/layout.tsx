import type { Metadata } from "next";
import type { ReactNode } from "react";

import { planFontClassName } from "@/lib/revenue-plan-fonts";

import "../revenue-model/revenue-plan-print.css";
import "./directors-agreement-print.css";
import "../revenue-model/revenue-plan.css";

export const metadata: Metadata = {
  title: "Final Directors Agreement | Alpha Freight",
  description: "Private final directors, executive remuneration, governance and UK operating agreement.",
  robots: { index: false, follow: false },
};

export default function DirectorsAgreementLayout({ children }: { children: ReactNode }) {
  return <div className={planFontClassName}>{children}</div>;
}
