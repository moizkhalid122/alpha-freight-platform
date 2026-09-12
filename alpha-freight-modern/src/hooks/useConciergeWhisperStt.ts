"use client";

import { useCallback, useRef } from "react";
import { shouldUseWhisperStt } from "@/lib/concierge/concierge-cost";

type WhisperSttOptions = {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: () => void;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function useConciergeWhisperStt() {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  type SpeechRecognitionInstance = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((event: {
      results: { length: number; [index: number]: { [index: number]: { transcript: string }; isFinal?: boolean } };
    }) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
  };

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);

  const stopTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    const form = new FormData();
    form.append("file", blob, "speech.webm");
    const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
    if (!response.ok) return "";
    const payload = (await response.json()) as { text?: string };
    return payload.text?.trim() || "";
  }, []);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopTracks();
    }
  }, [stopTracks]);

  const startListening = useCallback(
    async (options: WhisperSttOptions) => {
      if (!shouldUseWhisperStt() || activeRef.current) return false;
      activeRef.current = true;
      chunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        mediaStreamRef.current = stream;

        const mimeType = pickMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          void (async () => {
            const blob = new Blob(chunksRef.current, {
              type: mimeType || "audio/webm",
            });
            chunksRef.current = [];
            recorderRef.current = null;
            stopTracks();

            if (!activeRef.current) return;
            activeRef.current = false;

            if (!blob.size) {
              options.onError?.();
              return;
            }

            try {
              const text = await transcribeBlob(blob);
              if (text) options.onFinal(text);
              else options.onError?.();
            } catch {
              options.onError?.();
            }
          })();
        };

        recorder.start();

        const w = window as Window & {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        };
        const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = "en-GB";
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.onresult = (event) => {
            let interim = "";
            for (let i = 0; i < event.results.length; i++) {
              const piece = event.results[i][0]?.transcript ?? "";
              if (event.results[i].isFinal) continue;
              interim += piece;
            }
            if (interim.trim()) options.onInterim?.(interim.trim());
          };
          recognition.onend = () => {
            if (recorder.state === "recording") recorder.stop();
          };
          recognition.onerror = () => {
            if (recorder.state === "recording") recorder.stop();
          };
          recognitionRef.current = recognition;
          recognition.start();
        } else {
          window.setTimeout(() => {
            if (recorder.state === "recording") recorder.stop();
          }, 5200);
        }

        return true;
      } catch {
        activeRef.current = false;
        stopTracks();
        options.onError?.();
        return false;
      }
    },
    [stopTracks, transcribeBlob],
  );

  return { startListening, stopListening, isWhisperMode: shouldUseWhisperStt() };
}
