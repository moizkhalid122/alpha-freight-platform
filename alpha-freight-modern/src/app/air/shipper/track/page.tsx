import { Suspense } from "react";
import AirShipperTrackPage from "@/components/air/pages/AirShipperTrackPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading…</div>}>
      <AirShipperTrackPage />
    </Suspense>
  );
}
