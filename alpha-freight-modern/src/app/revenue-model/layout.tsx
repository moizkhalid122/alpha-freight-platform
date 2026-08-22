import type { Metadata } from "next";
import type { ReactNode } from "react";

import { planFontClassName } from "@/lib/revenue-plan-fonts";

import "./revenue-plan-print.css";
import "./revenue-plan.css";

export const metadata: Metadata = {
  title: "Strategic Revenue Plan | Alpha Freight",
  description: "Private strategic revenue plan — leadership use only.",
  robots: { index: false, follow: false },
};

export default function RevenueModelLayout({ children }: { children: ReactNode }) {
  return <div className={planFontClassName}>{children}</div>;
}
