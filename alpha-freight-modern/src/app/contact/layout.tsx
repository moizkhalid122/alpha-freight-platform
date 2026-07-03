import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Alpha Freight Solutions",
  description:
    "Contact Alpha Freight for freight brokerage services. Phone, email, WhatsApp, and office at 124 City Road, London EC1V 2NX. Support available 24/7.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
