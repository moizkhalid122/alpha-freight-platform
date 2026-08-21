"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Loader2, Sparkles } from "lucide-react";

type CommercialDirectorLoginLottieProps = {
  className?: string;
  loop?: boolean;
  onComplete?: () => void;
};

export default function CommercialDirectorLoginLottie({
  className = "h-64 w-64",
  loop = false,
  onComplete,
}: CommercialDirectorLoginLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/lottie/commercial-director-login-thank-you.json")
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
    return <Loader2 className={`${className} animate-spin text-gray-300`} />;
  }

  if (status === "error" || !animationData) {
    return <Sparkles className={`${className} text-blue-500`} strokeWidth={1.25} />;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay
      onComplete={onComplete}
      className={className}
      style={{ background: "transparent" }}
    />
  );
}
