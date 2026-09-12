"use client";

import { motion } from "framer-motion";
import AiOrbLottie from "@/components/chat/AiOrbLottie";
import type { ConciergeOrbMode } from "@/components/concierge/concierge-orb-types";
import type { ConciergeUserEmotion } from "@/lib/concierge/concierge-emotion";
import { orbStyleForEmotion } from "@/lib/concierge/concierge-emotion";
import {
  useConciergeOrbAudioLevel,
  type OrbAudioSource,
} from "@/hooks/useConciergeOrbAudioLevel";

export type { ConciergeOrbMode };

type ConciergeVoiceOrbProps = {
  mode?: ConciergeOrbMode;
  className?: string;
  audioActive?: boolean;
  getMicStream?: () => MediaStream | null;
  getRemoteAudio?: () => HTMLAudioElement | null;
  userSpeaking?: boolean;
  aiSpeaking?: boolean;
  emotionTone?: ConciergeUserEmotion;
};

function motionFromSource(source: OrbAudioSource, level: number, mode: ConciergeOrbMode) {
  if (source === "user") {
    return {
      y: -8 - level * 32,
      scale: 1.03 + level * 0.12,
      playbackSpeed: 0.95 + level * 0.55,
    };
  }

  if (source === "ai") {
    return {
      y: -2,
      scale: 1 + level * 0.18,
      playbackSpeed: 0.9 + level * 0.65,
    };
  }

  if (mode === "thinking") {
    return { y: -4, scale: 1.02, playbackSpeed: 1.05 };
  }

  return { y: 0, scale: 1, playbackSpeed: 0.88 };
}

export default function ConciergeVoiceOrb({
  mode = "idle",
  className = "h-14 w-14",
  audioActive = false,
  getMicStream,
  getRemoteAudio,
  userSpeaking = false,
  aiSpeaking = false,
  emotionTone = "neutral",
}: ConciergeVoiceOrbProps) {
  const { level, source } = useConciergeOrbAudioLevel({
    active: audioActive,
    getMicStream,
    getRemoteAudio,
    userSpeaking,
    aiSpeaking,
  });

  const baseMotion = motionFromSource(source, level, mode);
  const emotionStyle = orbStyleForEmotion(emotionTone);

  const orbMotion = {
    y: baseMotion.y * emotionStyle.yScale,
    scale:
      baseMotion.scale +
      (source === "user" ? level * emotionStyle.scaleBoost : level * emotionStyle.scaleBoost * 0.6),
    playbackSpeed: baseMotion.playbackSpeed * emotionStyle.playbackMult,
  };

  const calm = source === "none" && mode !== "thinking";
  const glowBackground =
    source === "user"
      ? emotionStyle.userGlow
      : source === "ai"
        ? emotionStyle.aiGlow
        : emotionStyle.idleGlow;

  return (
    <motion.div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      animate={{
        y: orbMotion.y,
        scale: orbMotion.scale,
      }}
      transition={{
        type: "spring",
        stiffness: calm ? emotionStyle.springStiffness * 0.55 : emotionStyle.springStiffness,
        damping: emotionStyle.springDamping,
        mass: emotionTone === "excited" ? 0.72 : 0.85,
      }}
      aria-hidden
    >
      <motion.span
        className="pointer-events-none absolute inset-[-14%] rounded-full"
        animate={{
          opacity:
            source === "user"
              ? emotionStyle.glowOpacity + level * 0.45
              : source === "ai"
                ? emotionStyle.glowOpacity * 0.85 + level * 0.5
                : emotionStyle.glowOpacity * 0.35,
          scale: source === "none" ? 0.92 : 1 + level * (emotionTone === "excited" ? 0.24 : 0.18),
        }}
        transition={{
          type: "spring",
          stiffness: emotionTone === "confused" ? 120 : 200,
          damping: emotionTone === "confused" ? 30 : 24,
        }}
        style={{
          background: glowBackground,
          filter: "blur(10px)",
        }}
      />

      <AiOrbLottie className="relative h-full w-full" playbackSpeed={orbMotion.playbackSpeed} />
    </motion.div>
  );
}
