"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Loader2 } from "lucide-react";

type AiOrbLottieProps = {
  className?: string;
  loop?: boolean;
};

export default function AiOrbLottie({
  className = "h-9 w-9",
  loop = true,
}: AiOrbLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

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
      animationData={animationData}
      loop={loop}
      autoplay
      className={className}
    />
  );
}
