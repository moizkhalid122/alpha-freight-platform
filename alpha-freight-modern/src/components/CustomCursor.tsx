"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [cursorText, setCursorText] = useState("");
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(cursorX, springConfig);
  const y = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isHoverable = target.closest("a, button, .group, .cursor-pointer");
      const text = (target.closest("[data-cursor]") as HTMLElement)?.dataset.cursor;
      
      if (isHoverable) {
        setHovered(true);
        setCursorText(text || "");
      } else {
        setHovered(false);
        setCursorText("");
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleHover);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleHover);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-4 h-4 bg-[#BFFF07] rounded-full pointer-events-none z-[9999] flex items-center justify-center mix-blend-difference"
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        width: hovered ? (cursorText ? 80 : 60) : 16,
        height: hovered ? (cursorText ? 80 : 60) : 16,
        backgroundColor: hovered ? "#BFFF07" : "#BFFF07",
      }}
    >
      {cursorText && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-black text-black uppercase tracking-tighter text-center"
        >
          {cursorText}
        </motion.span>
      )}
    </motion.div>
  );
}
