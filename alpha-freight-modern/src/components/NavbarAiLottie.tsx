"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

type NavbarAiLottieProps = {
  className?: string;
};

export default function NavbarAiLottie({ className = "h-7 w-7" }: NavbarAiLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/lottie/alpha-ai-nav.json")
      .then((response) => {
        if (!response.ok) throw new Error("AI nav animation missing");
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
    return (
      <span
        className={`${className} inline-block shrink-0 rounded-full bg-gradient-to-br from-cyan-400/80 to-violet-500/80`}
        aria-hidden
      />
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      className={className}
    />
  );
}
