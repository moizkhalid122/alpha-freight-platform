"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, Globe, Zap } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  openai: "AI + Knowledge",
  "knowledge-base": "Knowledge Base",
  "help-centre": "Help Centre",
  clarification: "Clarification",
  tool: "Freight Tool",
  web_search: "Live web data",
  live_weather: "Live weather",
  offline_weather: "Offline guide",
  "openai+web": "AI + Live web",
  instant: "Built-in answer",
  "marketing-fallback": "Offline template",
  "public-instant-social": "Built-in answer",
};

export default function AiConfidenceFooter({
  responseTimeMs,
  knowledgeSource,
}: {
  responseTimeMs?: number;
  knowledgeSource?: string;
}) {
  const seconds = responseTimeMs ? (responseTimeMs / 1000).toFixed(1) : "—";
  const sourceLabel = knowledgeSource ? SOURCE_LABELS[knowledgeSource] || "Knowledge Base" : "Knowledge Base";
  const SourceIcon =
    knowledgeSource === "web_search" ||
    knowledgeSource === "openai+web" ||
    knowledgeSource === "live_weather"
      ? Globe
      : BookOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#ececec]/80 bg-white/50 px-3 py-2 text-[11px] text-[#888] backdrop-blur-sm"
    >
      <span className="flex items-center gap-1.5">
        <SourceIcon className="h-3 w-3 text-[#7a9900]" />
        {sourceLabel}
      </span>
      <span className="hidden h-3 w-px bg-[#e5e5e5] sm:block" />
      <span className="flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-[#7a9900]" />
        UK freight expert
      </span>
      <span className="hidden h-3 w-px bg-[#e5e5e5] sm:block" />
      <span className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-[#7a9900]" />
        Response time {seconds}s
      </span>
    </motion.div>
  );
}
