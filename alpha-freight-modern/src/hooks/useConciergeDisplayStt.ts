"use client";

import { useCallback, useRef } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: { isFinal?: boolean; 0?: { transcript?: string } };
        };
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/** Display-only STT for live typing captions while Realtime owns the mic conversation. */
export function useConciergeDisplayStt() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);
  const onLiveRef = useRef<(text: string, isFinal: boolean) => void>(() => {});
  const restartTimerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  const start = useCallback(
    (onLive: (text: string, isFinal: boolean) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return false;

      stop();
      activeRef.current = true;
      onLiveRef.current = onLive;

      const recognition = new Ctor();
      recognition.lang = "en-GB";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        if (!activeRef.current) return;
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i]?.[0]?.transcript?.trim() || "";
          if (!piece) continue;
          if (event.results[i]?.isFinal) finalText += `${piece} `;
          else interim += `${piece} `;
        }
        const live = (finalText || interim).trim();
        if (live) onLiveRef.current(live, Boolean(finalText.trim()));
      };

      recognition.onerror = () => {
        if (!activeRef.current) return;
        restartTimerRef.current = window.setTimeout(() => {
          if (activeRef.current) start(onLiveRef.current);
        }, 400);
      };

      recognition.onend = () => {
        if (!activeRef.current) return;
        restartTimerRef.current = window.setTimeout(() => {
          if (activeRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {
              start(onLiveRef.current);
            }
          }
        }, 120);
      };

      try {
        recognition.start();
        return true;
      } catch {
        return false;
      }
    },
    [stop],
  );

  return { start, stop };
}
