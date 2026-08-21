"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AirLoginPlaneLottie from "@/components/air/AirLoginPlaneLottie";

type AirLoginTransitionOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  targetPath: string;
};

export default function AirLoginTransitionOverlay({
  isOpen,
  onClose,
  targetPath,
}: AirLoginTransitionOverlayProps) {
  const router = useRouter();
  const navigatedRef = useRef(false);

  const navigateToTarget = () => {
    if (navigatedRef.current || !targetPath) return;
    navigatedRef.current = true;
    router.push(targetPath);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      navigatedRef.current = false;
      return;
    }

    const fallbackTimer = window.setTimeout(navigateToTarget, 4200);
    return () => window.clearTimeout(fallbackTimer);
  }, [isOpen, targetPath]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAF9F6]"
        >
          <div className="flex flex-col items-center px-6 text-center">
            <AirLoginPlaneLottie
              className="h-56 w-56 sm:h-72 sm:w-72"
              onComplete={navigateToTarget}
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="air-font-display mt-2 text-lg font-medium tracking-tight text-slate-900 sm:text-xl"
            >
              Preparing your air freight workspace
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-2 text-sm text-slate-500"
            >
              Clearing for takeoff...
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
