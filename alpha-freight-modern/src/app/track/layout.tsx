import { marketingSeo } from "@/lib/marketing-seo";

export const metadata = marketingSeo.trackShipment;

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
