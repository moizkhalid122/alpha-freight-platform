"use client";

import { useState } from "react";
import EditorIntakeComplete from "@/components/editor-intake/EditorIntakeComplete";
import EditorIntakeForm from "@/components/editor-intake/EditorIntakeForm";

export default function EditorIntakePageContent() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="min-h-[100dvh] bg-[#f4f4f1] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <EditorIntakeComplete />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f4f1] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Alpha Freight · Private form</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Editor details</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Please complete all fields. Upload a clear profile photo and a valid ID (passport or driving licence).
        </p>
        <div className="mt-8 rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <EditorIntakeForm onSuccess={() => setDone(true)} />
        </div>
      </div>
    </div>
  );
}
