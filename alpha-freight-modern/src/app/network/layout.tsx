import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.network;

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
