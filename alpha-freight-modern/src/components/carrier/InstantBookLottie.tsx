"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { ShieldCheck, Loader2 } from "lucide-react";

type InstantBookLottieProps = {
  className?: string;
  loop?: boolean;
};

type LottieLayer = { nm?: string };

type LottieAnimation = {
  layers?: LottieLayer[];
};

const MESSAGE_LAYER_PATTERN = /^(letter|bubble thought|3)$/i;

function stripMessageLayers(data: LottieAnimation) {
  return {
    ...data,
    layers: (data.layers || []).filter(
      (layer) => !MESSAGE_LAYER_PATTERN.test(layer.nm || "")
    ),
  };
}

export default function InstantBookLottie({
  className = "h-48 w-48",
  loop = true,
}: InstantBookLottieProps) {
  const [animationData, setAnimationData] = useState<LottieAnimation | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/ready-set-go.json")
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
    return stripMessageLayers(animationData);
  }, [animationData]);

  if (status === "loading") {
    return <Loader2 className={`${className} animate-spin text-slate-300`} />;
  }

  if (status === "error" || !processedAnimation) {
    return <ShieldCheck className={`${className} text-emerald-500`} strokeWidth={1.5} />;
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
