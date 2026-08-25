import { createPageMetadata } from "@/lib/seo";
import { publicAiReplyFont } from "@/lib/public-ai-fonts";
import "./public-ai.css";

export const metadata = createPageMetadata({
  title: "Free UK Freight AI | Ask Haulage & Logistics Questions | Alpha Freight",
  description:
    "I asked Alpha Freight AI about UK freight — try free. RPM, diesel, loads, POD, payouts & haulage answers. No login required.",
  path: "/ai",
  image: "/alpha freight truck.jpg",
  keywords: [
    "UK freight AI",
    "freight AI",
    "free freight AI",
    "haulage AI",
    "Alpha Freight AI",
    "UK haulage AI",
    "RPM calculator UK",
    "diesel price haulage UK",
    "find loads AI UK",
  ],
});

export default function FreeFreightAiLayout({ children }: { children: React.ReactNode }) {
  return <div className={publicAiReplyFont.variable}>{children}</div>;
}
