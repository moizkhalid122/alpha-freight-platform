import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.verifyEmployee;

export default function VerifyEmployeeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
