"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import CommercialDirectorLoginLottie from "@/components/commercial-director/CommercialDirectorLoginLottie";
import { COMMERCIAL_DIRECTOR_PROFILE } from "@/lib/commercial-director-permissions";

type CommercialDirectorLoginTransitionOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  targetPath: string;
};

export default function CommercialDirectorLoginTransitionOverlay({
  isOpen,
  onClose,
  targetPath,
}: CommercialDirectorLoginTransitionOverlayProps) {
  const router = useRouter();
  const navigatedRef = useRef(false);
  const firstName = COMMERCIAL_DIRECTOR_PROFILE.name.split(" ")[0];

  const navigateToTarget = () => {
    if (navigatedRef.current || !targetPath) return;
    navigatedRef.current = true;
    router.replace(targetPath);
    router.refresh();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      navigatedRef.current = false;
      return;
    }

    const fallbackTimer = window.setTimeout(navigateToTarget, 3800);
    return () => window.clearTimeout(fallbackTimer);
  }, [isOpen, targetPath]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center px-6 text-center">
            <CommercialDirectorLoginLottie
              className="h-64 w-64 sm:h-80 sm:w-80"
              onComplete={navigateToTarget}
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="air-font-display mt-2 text-xl font-medium tracking-tight text-gray-900 sm:text-2xl"
            >
              Welcome back, {firstName}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm text-gray-500"
            >
              Opening your executive panel...
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
