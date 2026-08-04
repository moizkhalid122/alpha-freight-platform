"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { CalendarDays, Loader2 } from "lucide-react";

type LeaveSubmittedLottieProps = {
  className?: string;
  loop?: boolean;
};

export default function LeaveSubmittedLottie({
  className = "h-44 w-44",
  loop = true,
}: LeaveSubmittedLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/animations/cat-crying-leave.json")
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
    return <CalendarDays className={`${className} text-indigo-400`} strokeWidth={1.5} />;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay
      className={className}
      style={{ background: "transparent" }}
    />
  );
}
