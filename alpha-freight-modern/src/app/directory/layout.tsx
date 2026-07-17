import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.directory;

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
