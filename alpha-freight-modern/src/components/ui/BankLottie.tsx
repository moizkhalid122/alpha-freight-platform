"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { Landmark, Loader2 } from "lucide-react";

type BankLottieProps = {
  className?: string;
  loop?: boolean;
};

type LottieLayer = { nm?: string };

type LottieAnimation = {
  layers?: LottieLayer[];
};

function stripBackgroundLayer(data: LottieAnimation) {
  return {
    ...data,
    layers: (data.layers || []).filter(
      (layer) => !/^BG\/|background/i.test(layer.nm || "")
    ),
  };
}

export default function BankLottie({
  className = "h-56 w-56",
  loop = true,
}: BankLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/bank.json")
      .then((response) => {
        if (!response.ok) throw new Error("Animation file missing");
        return response.json();
      })
      .then((data: LottieAnimation) => {
        if (active) {
          setAnimationData(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const processedAnimation = useMemo(() => {
    if (!animationData) return null;
    return stripBackgroundLayer(animationData);
  }, [animationData]);

  if (status === "loading") {
    return <Loader2 className={`${className} animate-spin text-slate-300`} />;
  }

  if (status === "error" || !processedAnimation) {
    return <Landmark className={`${className} text-violet-300`} strokeWidth={1.5} />;
  }

  return (
    <Lottie
      animationData={processedAnimation}
      loop={loop}
      autoplay
      className={className}
      style={{ background: "transparent" }}
    />
  );
}
