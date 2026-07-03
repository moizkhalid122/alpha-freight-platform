import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-time Tracking | GPS & IoT Cargo Monitoring | Alpha Freight",
  description:
    "Track freight live with GPS precision, milestone alerts, geofencing, and customer-facing visibility powered by Alpha Freight.",
};

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
