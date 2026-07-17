import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.cookiePolicy;

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
