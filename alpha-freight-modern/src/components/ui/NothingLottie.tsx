"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { Loader2, Package } from "lucide-react";

type NothingLottieProps = {
  className?: string;
  loop?: boolean;
  hideBackground?: boolean;
};

type LottieLayer = { nm?: string };

type LottieAnimation = {
  layers?: LottieLayer[];
};

function stripBackgroundLayer(data: LottieAnimation) {
  return {
    ...data,
    layers: (data.layers || []).filter(
      (layer) => !/Layer 8|background blob|bg blob/i.test(layer.nm || "")
    ),
  };
}

export default function NothingLottie({
  className = "h-56 w-56",
  loop = true,
  hideBackground = true,
}: NothingLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/nothing.json")
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
    return hideBackground ? stripBackgroundLayer(animationData) : animationData;
  }, [animationData, hideBackground]);

  if (status === "loading") {
    return <Loader2 className={`${className} animate-spin text-slate-300`} />;
  }

  if (status === "error" || !processedAnimation) {
    return <Package className={`${className} text-slate-300`} strokeWidth={1.5} />;
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
