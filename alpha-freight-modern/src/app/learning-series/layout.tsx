import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning Series | Alpha Freight",
  description:
    "Free UK freight and logistics lessons from Alpha Freight. Watch our YouTube Learning Series on carriers, suppliers, compliance, and the Alpha Freight platform.",
};

export default function LearningSeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
