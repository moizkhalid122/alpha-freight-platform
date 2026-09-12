"use client";

import { motion, AnimatePresence } from "framer-motion";

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: (i * 17) % 100,
  delay: (i % 6) * 0.05,
  color: ["#38bdf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"][i % 5],
}));

type ConciergeCelebrationProps = {
  active: boolean;
};

export default function ConciergeCelebration({ active }: ConciergeCelebrationProps) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[101] overflow-hidden"
          aria-hidden
        >
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: "45vh", x: `${p.x}vw`, scale: 0 }}
              animate={{ opacity: 0, y: "110vh", scale: 1.2 }}
              transition={{ duration: 2.2, delay: p.delay, ease: "easeOut" }}
              className="absolute h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
