import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.findLoads;

export default function CarrierSignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
