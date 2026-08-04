import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "White Label Platform | Your Brand, Our Tech | Alpha Freight",
  description:
    "Launch a fully branded freight marketplace under your logo, colors, and domain. Alpha Freight White Label powers brokers, 3PLs, and enterprise logistics teams.",
};

export default function WhiteLabelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
