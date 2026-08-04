"use client";

import { motion } from "framer-motion";

export function HomeHeroMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <motion.div
        className="absolute -left-[10%] top-[5%] h-[55vh] w-[55vh] rounded-full bg-[#BFFF07]/10 blur-[120px]"
        animate={{ x: [0, 35, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[8%] bottom-[10%] h-[45vh] w-[45vh] rounded-full bg-violet-500/10 blur-[100px]"
        animate={{ x: [0, -30, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}
