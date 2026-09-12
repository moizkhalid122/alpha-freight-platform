"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  shouldPreloadConciergeGreeting,
  shouldUseElevenLabsTts,
  shouldUseOpenAiTts,
} from "@/lib/concierge/concierge-cost";
import { getCachedTtsUrl, setCachedTtsUrl } from "@/lib/concierge/concierge-tts-cache";

export const CONCIERGE_GREETING_TEXT = "Hi, I'm Alpha. How can I help you today?";

function pickBritishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /google uk english/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en-GB")) ||
    voices.find((v) => /english.*united kingdom/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

function speakWithBrowser(text: string): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 1.03;
    utterance.pitch = 1.02;
    const voice = pickBritishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function fetchVoiceBlob(path: string, text: string, signal: AbortSignal): Promise<Blob | null> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) return null;

  const blob = await response.blob();
  if (!blob.size) return null;
  return blob;
}

async function fetchOpenAiAudio(text: string, signal: AbortSignal): Promise<Blob | null> {
  return fetchVoiceBlob("/api/voice/openai/speak", text, signal);
}

async function fetchElevenLabsAudio(text: string, signal: AbortSignal): Promise<Blob | null> {
  const response = await fetch("/api/voice/speak/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok || !response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  if (!chunks.length) return null;
  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
}

async function fetchPremiumAudio(text: string, signal: AbortSignal): Promise<Blob | null> {
  if (shouldUseOpenAiTts()) {
    const openAi = await fetchOpenAiAudio(text, signal);
    if (openAi?.size) return openAi;
  }
  if (shouldUseElevenLabsTts()) {
    return fetchElevenLabsAudio(text, signal);
  }
  return null;
}

type SpeakOptions = {
  instant?: boolean;
};

export function useConciergeVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakGenerationRef = useRef(0);
  const greetingAudioUrlRef = useRef<string | null>(null);
  const greetingLoadRef = useRef<Promise<string | null> | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const setSpeaking = useCallback((value: boolean) => {
    isSpeakingRef.current = value;
    setIsSpeaking(value);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.onvoiceschanged = warm;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const playBlob = useCallback(
    async (blob: Blob, generation: number): Promise<boolean> => {
      if (speakGenerationRef.current !== generation) return false;

      window.speechSynthesis?.cancel();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        void audio.play().catch(() => resolve());
      });

      return speakGenerationRef.current === generation;
    },
    [],
  );

  const preloadGreeting = useCallback(() => {
    if (!shouldPreloadConciergeGreeting()) return null;
    const cached = getCachedTtsUrl(CONCIERGE_GREETING_TEXT);
    if (cached) {
      greetingAudioUrlRef.current = cached;
      return Promise.resolve(cached);
    }
    if (greetingAudioUrlRef.current || greetingLoadRef.current) return greetingLoadRef.current;

    greetingLoadRef.current = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        const blob = await fetchOpenAiAudio(CONCIERGE_GREETING_TEXT, controller.signal);
        window.clearTimeout(timeoutId);
        if (!blob || blob.size === 0) return null;
        const url = URL.createObjectURL(blob);
        greetingAudioUrlRef.current = url;
        setCachedTtsUrl(CONCIERGE_GREETING_TEXT, url);
        return url;
      } catch {
        return null;
      } finally {
        greetingLoadRef.current = null;
      }
    })();

    return greetingLoadRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new AudioContext();
      void ctx.resume().finally(() => void ctx.close());
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    speakGenerationRef.current += 1;
    queueRef.current = Promise.resolve();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  const runQueued = useCallback(
    (task: () => Promise<void>) => {
      queueRef.current = queueRef.current.then(task).catch(() => {});
      return queueRef.current;
    },
    [],
  );

  const waitUntilIdle = useCallback(async (maxMs = 30000): Promise<void> => {
    const start = Date.now();
    while (isSpeakingRef.current && Date.now() - start < maxMs) {
      await new Promise((r) => window.setTimeout(r, 50));
    }
    await queueRef.current;
  }, []);

  const prefetchSpeech = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !shouldUseOpenAiTts() || getCachedTtsUrl(trimmed)) return;

    void (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 10000);
        const blob = await fetchOpenAiAudio(trimmed, controller.signal);
        window.clearTimeout(timeoutId);
        if (blob?.size) {
          setCachedTtsUrl(trimmed, URL.createObjectURL(blob));
        }
      } catch {
        /* ignore prefetch errors */
      }
    })();
  }, []);

  const speakInstant = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      void runQueued(async () => {
        setSpeaking(true);
        await speakWithBrowser(trimmed);
        setSpeaking(false);
      });
    },
    [runQueued, setSpeaking],
  );

  const speakGreeting = useCallback(async () => {
    const generation = speakGenerationRef.current + 1;
    speakGenerationRef.current = generation;
    stop();
    speakGenerationRef.current = generation;

    await runQueued(async () => {
      setSpeaking(true);

      if (!shouldUseOpenAiTts()) {
        if (speakGenerationRef.current === generation) {
          await speakWithBrowser(CONCIERGE_GREETING_TEXT);
        }
        setSpeaking(false);
        return;
      }

      const cached = greetingAudioUrlRef.current;
      if (cached && speakGenerationRef.current === generation) {
        window.speechSynthesis?.cancel();
        const audio = new Audio(cached);
        audioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          void audio.play().catch(() => resolve());
        });
        setSpeaking(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 10000);
        const blob = await fetchOpenAiAudio(CONCIERGE_GREETING_TEXT, controller.signal);
        window.clearTimeout(timeoutId);

        if (blob?.size && speakGenerationRef.current === generation) {
          const played = await playBlob(blob, generation);
          if (played && !greetingAudioUrlRef.current) {
            greetingAudioUrlRef.current = URL.createObjectURL(blob);
          }
          setSpeaking(false);
          return;
        }
      } catch {
        /* fall through */
      }

      if (speakGenerationRef.current === generation) {
        await speakWithBrowser(CONCIERGE_GREETING_TEXT);
      }
      setSpeaking(false);
    });

    await waitUntilIdle();
  }, [playBlob, runQueued, setSpeaking, stop, waitUntilIdle]);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      if (options.instant || !shouldUseOpenAiTts()) {
        speakInstant(trimmed);
        return true;
      }

      const generation = speakGenerationRef.current + 1;
      speakGenerationRef.current = generation;

      await runQueued(async () => {
        if (speakGenerationRef.current !== generation) return;

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setSpeaking(true);

        const cachedUrl = getCachedTtsUrl(trimmed);
        if (cachedUrl && speakGenerationRef.current === generation) {
          window.speechSynthesis?.cancel();
          const audio = new Audio(cachedUrl);
          audioRef.current = audio;
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            void audio.play().catch(() => resolve());
          });
          if (speakGenerationRef.current === generation) return;
        }

        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 12000);
          const blob = await fetchPremiumAudio(trimmed, controller.signal);
          window.clearTimeout(timeoutId);

          if (speakGenerationRef.current !== generation) return;

          if (blob?.size) {
            const played = await playBlob(blob, generation);
            if (played) {
              const url = URL.createObjectURL(blob);
              setCachedTtsUrl(trimmed, url);
            }
            return;
          }
        } catch {
          /* fall through */
        }

        if (speakGenerationRef.current === generation) {
          await speakWithBrowser(trimmed);
        }
      });

      await waitUntilIdle();
      return speakGenerationRef.current === generation || !isSpeakingRef.current;
    },
    [playBlob, runQueued, setSpeaking, speakInstant, waitUntilIdle],
  );

  const speakAsync = useCallback(
    (text: string, options?: SpeakOptions) => {
      void speak(text, options);
    },
    [speak],
  );

  /** @deprecated Use speakAsync once per turn — avoids double audio. */
  const speakPhrase = useCallback(
    (text: string) => {
      void speak(text);
    },
    [speak],
  );

  return {
    speak,
    speakAsync,
    speakGreeting,
    speakInstant,
    speakPhrase,
    preloadGreeting,
    prefetchSpeech,
    stop,
    unlockAudio,
    waitUntilIdle,
    isSpeaking,
    isSpeakingRef,
  };
}
