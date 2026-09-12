"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Loader2 } from "lucide-react";

type AiOrbLottieProps = {
  className?: string;
  loop?: boolean;
  playbackSpeed?: number;
};

export default function AiOrbLottie({
  className = "h-9 w-9",
  loop = true,
  playbackSpeed = 1,
}: AiOrbLottieProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(Math.max(0.5, Math.min(2.2, playbackSpeed)));
  }, [playbackSpeed]);

  useEffect(() => {
    let active = true;

    fetch("/lottie/orb-ai-assistant.json")
      .then((response) => {
        if (!response.ok) throw new Error("Orb animation missing");
        return response.json();
      })
      .then((data) => {
        if (active) setAnimationData(data);
      })
      .catch(() => {
        if (active) setAnimationData(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!animationData) {
    return <Loader2 className={`${className} animate-spin text-slate-300`} />;
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay
      className={className}
    />
  );
}
