import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.academy;

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
