import { Suspense } from "react";
import SearchWorkspace from "@/components/feed/SearchWorkspace";

export const dynamic = "force-dynamic";

export default function SupplierFeedSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SearchWorkspace role="supplier" />
    </Suspense>
  );
}
