"use client";

import { useCallback, useRef, useState } from "react";
import {
  detectConciergeUserEmotion,
  mergeEmotionTone,
  type ConciergeUserEmotion,
} from "@/lib/concierge/concierge-emotion";

export function useConciergeEmotion() {
  const [emotion, setEmotion] = useState<ConciergeUserEmotion>("neutral");
  const emotionRef = useRef<ConciergeUserEmotion>("neutral");
  emotionRef.current = emotion;
  const speechStartedAtRef = useRef<number | null>(null);
  const firstPartialAtRef = useRef<number | null>(null);
  const decayTimerRef = useRef<number | null>(null);

  const clearDecayTimer = useCallback(() => {
    if (decayTimerRef.current) {
      window.clearTimeout(decayTimerRef.current);
      decayTimerRef.current = null;
    }
  }, []);

  const scheduleNeutralDecay = useCallback(() => {
    clearDecayTimer();
    decayTimerRef.current = window.setTimeout(() => {
      setEmotion("neutral");
    }, 45_000);
  }, [clearDecayTimer]);

  const onSpeechStarted = useCallback(() => {
    speechStartedAtRef.current = Date.now();
    firstPartialAtRef.current = null;
  }, []);

  const onSpeechStopped = useCallback(() => {
    speechStartedAtRef.current = null;
    firstPartialAtRef.current = null;
  }, []);

  const analyzeTranscript = useCallback(
    (text: string, isFinal: boolean): ConciergeUserEmotion => {
      const trimmed = text.trim();
      if (!trimmed) return emotionRef.current;

      const now = Date.now();
      if (!firstPartialAtRef.current && speechStartedAtRef.current) {
        firstPartialAtRef.current = now;
      }

      const speechDurationMs =
        speechStartedAtRef.current != null ? now - speechStartedAtRef.current : undefined;
      const hesitantStartMs =
        speechStartedAtRef.current != null && firstPartialAtRef.current != null
          ? firstPartialAtRef.current - speechStartedAtRef.current
          : undefined;

      const detected = detectConciergeUserEmotion({
        text: trimmed,
        isFinal,
        speechDurationMs: isFinal ? speechDurationMs : undefined,
        hesitantStartMs,
      });

      const next = mergeEmotionTone(emotionRef.current, detected);
      emotionRef.current = next;
      setEmotion(next);

      if (next !== "neutral") {
        scheduleNeutralDecay();
      }

      return next;
    },
    [scheduleNeutralDecay],
  );

  const resetEmotion = useCallback(() => {
    clearDecayTimer();
    speechStartedAtRef.current = null;
    firstPartialAtRef.current = null;
    emotionRef.current = "neutral";
    setEmotion("neutral");
  }, [clearDecayTimer]);

  return {
    emotion,
    onSpeechStarted,
    onSpeechStopped,
    analyzeTranscript,
    resetEmotion,
  };
}
