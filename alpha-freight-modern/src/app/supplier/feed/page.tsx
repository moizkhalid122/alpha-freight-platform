import { Suspense } from "react";
import FeedWorkspace from "@/components/feed/FeedWorkspace";

export const dynamic = "force-dynamic";

export default function SupplierFeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <FeedWorkspace role="supplier" />
    </Suspense>
  );
}
