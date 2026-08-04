"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PublicFreightAiApp from "@/components/marketing/PublicFreightAiApp";
import type { AiTopicPage } from "@/lib/ai-topic-pages";

interface AiTopicLandingProps {
  topic: AiTopicPage;
  canonicalUrl: string;
}

export default function AiTopicLanding({ topic }: AiTopicLandingProps) {
  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <div className="shrink-0 border-b border-[#ececec] bg-[#fafafa] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link href="/ai" className="text-xs font-medium text-[#999] hover:text-[#666]">
              ← Alpha Freight AI
            </Link>
            <h1 className="mt-1 text-lg font-semibold text-[#0d0d0d] sm:text-xl">{topic.h1}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">{topic.intro}</p>
          </div>
          {topic.relatedTool && (
            <Link
              href={topic.relatedTool.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-xs font-medium text-[#444] hover:bg-[#f7f7f8]"
            >
              {topic.relatedTool.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <PublicFreightAiApp embedded initialPrompt={topic.initialPrompt} />
      </div>
    </div>
  );
}
