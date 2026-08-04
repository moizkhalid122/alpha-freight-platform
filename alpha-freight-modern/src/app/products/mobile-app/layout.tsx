import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.mobileApp;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
