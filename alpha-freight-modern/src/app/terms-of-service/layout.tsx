import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.termsOfService;

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
