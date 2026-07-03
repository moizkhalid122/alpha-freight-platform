"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface VideoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  targetPath: string;
}

export default function VideoOverlay({
  isOpen,
  onClose,
  targetPath,
}: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const navigateToTarget = () => {
    if (!targetPath) return;
    router.push(targetPath);
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !targetPath) return;

    const fallbackTimer = window.setTimeout(navigateToTarget, 4500);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((e) => {
        console.error("Video play failed:", e);
        window.clearTimeout(fallbackTimer);
        navigateToTarget();
      });
    }

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [isOpen, targetPath]);

  const handleVideoEnd = () => {
    navigateToTarget();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white flex items-center justify-center"
        >
          <div className="max-w-3xl w-full">
            <video
              ref={videoRef}
              src="/Alpha freight.mp4"
              className="w-full"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
