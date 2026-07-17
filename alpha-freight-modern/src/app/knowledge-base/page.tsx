import { Suspense } from "react";
import KnowledgeBasePage from "./KnowledgeBasePage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <KnowledgeBasePage />
    </Suspense>
  );
}
