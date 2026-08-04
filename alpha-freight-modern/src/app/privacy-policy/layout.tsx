import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.privacyPolicy;

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
