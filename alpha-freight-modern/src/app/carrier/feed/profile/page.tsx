import { Suspense } from "react";
import ProfileWorkspace from "@/components/feed/ProfileWorkspace";

export const dynamic = "force-dynamic";

export default function CarrierFeedProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ProfileWorkspace role="carrier" />
    </Suspense>
  );
}
