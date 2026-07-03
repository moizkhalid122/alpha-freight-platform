"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { ShieldCheck, Loader2 } from "lucide-react";

type InstantBookLottieProps = {
  className?: string;
  loop?: boolean;
};

export default function InstantBookLottie({
  className = "h-48 w-48",
  loop = false,
}: InstantBookLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/ready-set-go.json")
      .then((response) => {
        if (!response.ok) throw new Error("Animation file missing");
        return response.json();
      })
      .then((data) => {
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

  if (status === "loading") {
    return <Loader2 className={`${className} animate-spin text-slate-300`} />;
  }

  if (status === "error" || !animationData) {
    return <ShieldCheck className={`${className} text-emerald-500`} strokeWidth={1.5} />;
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
