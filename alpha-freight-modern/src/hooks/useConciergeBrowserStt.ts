"use client";

import { useCallback, useRef } from "react";

const SILENCE_MS = 650;
const RESTART_MS = 80;
const DUPLICATE_MS = 2200;

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

export type BrowserSttHandlers = {
  onLiveTranscript: (text: string) => void;
  onUtterance: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
  shouldAcceptAudio: () => boolean;
  onBeforeUtterance?: (text: string) => void;
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

export function useConciergeBrowserStt() {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const handlersRef = useRef<BrowserSttHandlers | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const pendingTextRef = useRef("");
  const lastSubmittedRef = useRef<{ text: string; at: number } | null>(null);
  const startingRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRestart = useCallback(() => {
    clearRestartTimer();
    restartTimerRef.current = window.setTimeout(() => {
      if (!handlersRef.current?.shouldAcceptAudio()) return;
      startingRef.current = false;
      void startRef.current();
    }, RESTART_MS);
  }, [clearRestartTimer]);

  const submitUtterance = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || text.length < 2) return;
      const handlers = handlersRef.current;
      if (!handlers?.shouldAcceptAudio()) return;

      const now = Date.now();
      const last = lastSubmittedRef.current;
      if (last && last.text === text && now - last.at < DUPLICATE_MS) return;

      clearSilenceTimer();
      pendingTextRef.current = "";
      lastSubmittedRef.current = { text, at: now };
      handlers.onBeforeUtterance?.(text);
      handlers.onUtterance(text);

      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    },
    [clearSilenceTimer],
  );

  const scheduleSilenceSubmit = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      if (pendingTextRef.current.trim()) {
        submitUtterance(pendingTextRef.current);
      }
    }, SILENCE_MS);
  }, [clearSilenceTimer, submitUtterance]);

  const startRef = useRef<() => Promise<boolean>>(async () => false);

  const bindRecognition = useCallback(
    (recognition: SpeechRecognitionInstance) => {
      recognition.onresult = (event) => {
        const handlers = handlersRef.current;
        if (!handlers?.shouldAcceptAudio()) return;

        let finalChunk = "";
        let interimChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const piece = result[0]?.transcript ?? "";
          if (result.isFinal) finalChunk += piece;
          else interimChunk += piece;
        }

        let accumulated = "";
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0]?.transcript ?? "";
        }

        const live = accumulated.trim();
        if (live) {
          pendingTextRef.current = live;
          handlers.onLiveTranscript(live);
          scheduleSilenceSubmit();
        }

        if (finalChunk.trim()) {
          submitUtterance(finalChunk.trim());
        }
      };

      recognition.onerror = () => {
        handlersRef.current?.onListeningChange(false);
        startingRef.current = false;
        scheduleRestart();
      };

      recognition.onend = () => {
        handlersRef.current?.onListeningChange(false);
        startingRef.current = false;
        if (handlersRef.current?.shouldAcceptAudio()) {
          scheduleRestart();
        }
      };
    },
    [scheduleRestart, scheduleSilenceSubmit, submitUtterance],
  );

  const start = useCallback(async (): Promise<boolean> => {
    if (startingRef.current) return false;
    const ctor = getRecognitionCtor();
    if (!ctor || !handlersRef.current?.shouldAcceptAudio()) return false;

    startingRef.current = true;
    clearSilenceTimer();
    clearRestartTimer();
    pendingTextRef.current = "";

    try {
      if (!recognitionRef.current) {
        const recognition = new ctor();
        recognition.lang = "en-GB";
        recognition.continuous = true;
        recognition.interimResults = true;
        bindRecognition(recognition);
        recognitionRef.current = recognition;
      }

      recognitionRef.current.start();
      handlersRef.current.onListeningChange(true);
      startingRef.current = false;
      return true;
    } catch {
      startingRef.current = false;
      handlersRef.current?.onListeningChange(false);
      scheduleRestart();
      return false;
    }
  }, [bindRecognition, clearRestartTimer, clearSilenceTimer, scheduleRestart]);

  startRef.current = start;

  const stop = useCallback(() => {
    clearSilenceTimer();
    clearRestartTimer();
    pendingTextRef.current = "";
    startingRef.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      recognitionRef.current?.stop();
    }
    handlersRef.current?.onListeningChange(false);
  }, [clearRestartTimer, clearSilenceTimer]);

  const attachHandlers = useCallback((handlers: BrowserSttHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const detach = useCallback(() => {
    stop();
    handlersRef.current = null;
    recognitionRef.current = null;
  }, [stop]);

  return {
    attachHandlers,
    start,
    stop,
    detach,
    isSupported: typeof getRecognitionCtor() !== "undefined",
  };
}
