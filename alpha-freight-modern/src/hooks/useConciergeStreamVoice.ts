"use client";

import { useCallback, useRef } from "react";
import { speechForConcierge } from "@/lib/concierge-speech";

type StreamVoiceOptions = {
  speakAsync: (text: string) => void;
  stop: () => void;
};

/** Track stream text only — speak once when the full reply arrives (no double voice). */
export function useConciergeStreamVoice({ speakAsync, stop }: StreamVoiceOptions) {
  const hasSpokenRef = useRef(false);

  const resetStreamVoice = useCallback(() => {
    hasSpokenRef.current = false;
    stop();
  }, [stop]);

  const onStreamToken = useCallback((_fullText: string) => {
    /* caption only — voice plays once on complete */
  }, []);

  const onStreamComplete = useCallback(
    (fullText: string) => {
      if (hasSpokenRef.current) return;
      const spoken = speechForConcierge(fullText);
      if (!spoken) return;
      hasSpokenRef.current = true;
      speakAsync(spoken);
    },
    [speakAsync],
  );

  return { onStreamToken, onStreamComplete, resetStreamVoice };
}
