"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { resolveThinkingPresentation } from "@/lib/public-ai-thinking";
import { publicAiReplyFontClass } from "@/lib/public-ai-fonts";

function AnimatedThinkingDots() {
  return (
    <span className="inline-flex" aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="inline-block"
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: index * 0.18,
            ease: "easeInOut",
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

function ThinkingIntroLabel({ label }: { label: string }) {
  const base = label.replace(/\.{3}|…$/g, "").trimEnd();

  return (
    <>
      {base}
      <AnimatedThinkingDots />
    </>
  );
}

export default function AiSearchEffect({ query }: { query: string }) {
  const presentation = resolveThinkingPresentation(query);
  const [phase, setPhase] = useState<"intro" | "topic">("intro");

  useEffect(() => {
    setPhase("intro");
    if (presentation.mode !== "topic" || !presentation.topicLabel) return;

    const timer = window.setTimeout(() => setPhase("topic"), 700);
    return () => window.clearTimeout(timer);
  }, [query, presentation.mode, presentation.topicLabel]);

  const showTopic = presentation.mode === "topic" && phase === "topic" && presentation.topicLabel;

  return (
    <AnimatePresence mode="wait">
      {showTopic ? (
        <motion.p
          key="topic"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`text-[17px] font-medium leading-none text-[#1a1a1a] ${publicAiReplyFontClass}`}
        >
          {presentation.topicLabel}
        </motion.p>
      ) : (
        <motion.p
          key="intro"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`text-[17px] font-medium leading-none text-[#262626] ${publicAiReplyFontClass}`}
        >
          <ThinkingIntroLabel label={presentation.introLabel} />
        </motion.p>
      )}
    </AnimatePresence>
  );
}

