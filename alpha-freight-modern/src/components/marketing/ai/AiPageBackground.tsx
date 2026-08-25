"use client";

import { motion } from "framer-motion";

export default function AiPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#fafafa]" aria-hidden>
      <motion.div
        className="public-ai-bg-glow absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(186, 218, 255, 0.45) 0%, rgba(220, 235, 255, 0.2) 28%, rgba(255, 255, 255, 0) 62%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 55%)",
        }}
      />
    </div>
  );
}
