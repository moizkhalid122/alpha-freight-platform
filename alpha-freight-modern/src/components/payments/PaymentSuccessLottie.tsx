"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { CheckCircle2, Loader2 } from "lucide-react";

type PaymentSuccessLottieProps = {
  className?: string;
  loop?: boolean;
};

export default function PaymentSuccessLottie({
  className = "h-44 w-44",
  loop = false,
}: PaymentSuccessLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/payment-success.json")
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
    return <CheckCircle2 className={`${className} text-emerald-500`} strokeWidth={1.5} />;
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
