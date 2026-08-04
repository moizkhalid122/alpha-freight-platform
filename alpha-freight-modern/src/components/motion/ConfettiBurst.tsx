"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#BFFF07", "#ffffff", "#7c3aed", "#3b82f6", "#f472b6"];

function randomPiece(index: number) {
  return {
    id: index,
    x: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.8 + Math.random() * 1.2,
    rotate: Math.random() * 720 - 360,
    color: COLORS[index % COLORS.length],
    size: 6 + Math.random() * 8,
  };
}

export function ConfettiBurst({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [pieces] = useState(() => Array.from({ length: 48 }, (_, i) => randomPiece(i)));

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => onDone?.(), 2600);
    return () => window.clearTimeout(timer);
  }, [active, onDone]);

  return (
    <AnimatePresence>
      {active ? (
        <div className="pointer-events-none fixed inset-0 z-[10000] overflow-hidden">
          {pieces.map((piece) => (
            <motion.span
              key={piece.id}
              initial={{ opacity: 1, y: "-10%", x: `${piece.x}vw`, rotate: 0, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                y: ["-10%", "110vh"],
                rotate: piece.rotate,
                scale: [1, 1.2, 0.6],
              }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: "easeOut" }}
              className="absolute top-0 block rounded-sm"
              style={{
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}
