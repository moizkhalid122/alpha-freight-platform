"use client";

import { useEffect, useRef, useState } from "react";

export type OrbAudioSource = "none" | "user" | "ai";

type UseConciergeOrbAudioLevelOptions = {
  active?: boolean;
  getMicStream?: () => MediaStream | null;
  getRemoteAudio?: () => HTMLAudioElement | null;
  aiSpeaking?: boolean;
  userSpeaking?: boolean;
};

function readLevel(analyser: AnalyserNode, data: Uint8Array<ArrayBuffer>): number {
  analyser.getByteFrequencyData(data);
  let sum = 0;
  const start = 2;
  const end = Math.min(48, data.length);
  for (let i = start; i < end; i++) sum += data[i];
  const avg = sum / (end - start);
  return Math.min(1, avg / 128);
}

export function useConciergeOrbAudioLevel({
  active = false,
  getMicStream,
  getRemoteAudio,
  aiSpeaking = false,
  userSpeaking = false,
}: UseConciergeOrbAudioLevelOptions) {
  const [level, setLevel] = useState(0);
  const [source, setSource] = useState<OrbAudioSource>("none");
  const levelRef = useRef(0);

  useEffect(() => {
    if (!active) {
      levelRef.current = 0;
      setLevel(0);
      setSource("none");
      return;
    }

    let raf = 0;
    let attachTimer = 0;
    let audioCtx: AudioContext | null = null;
    let micAnalyser: AnalyserNode | null = null;
    let aiAnalyser: AnalyserNode | null = null;
    const micData = new Uint8Array(new ArrayBuffer(512));
    const aiData = new Uint8Array(new ArrayBuffer(512));
    let disposed = false;

    const ensureContext = async () => {
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      return audioCtx;
    };

    const attach = async () => {
      try {
        const ctx = await ensureContext();

        if (!micAnalyser) {
          const mic = getMicStream?.() ?? null;
          if (mic?.getAudioTracks().some((t) => t.enabled)) {
            micAnalyser = ctx.createAnalyser();
            micAnalyser.fftSize = 512;
            micAnalyser.smoothingTimeConstant = 0.82;
            ctx.createMediaStreamSource(mic).connect(micAnalyser);
          }
        }

        if (!aiAnalyser) {
          const audioEl = getRemoteAudio?.() ?? null;
          const remoteStream = audioEl?.srcObject;
          if (remoteStream instanceof MediaStream) {
            aiAnalyser = ctx.createAnalyser();
            aiAnalyser.fftSize = 512;
            aiAnalyser.smoothingTimeConstant = 0.78;
            ctx.createMediaStreamSource(remoteStream).connect(aiAnalyser);
          }
        }
      } catch {
        /* analyser optional */
      }
    };

    void attach();
    attachTimer = window.setInterval(() => {
      if (!disposed && (!micAnalyser || !aiAnalyser)) void attach();
    }, 450);

    const tick = () => {
      if (disposed) return;

      let micLevel = 0;
      let aiLevel = 0;
      if (micAnalyser) micLevel = readLevel(micAnalyser, micData);
      if (aiAnalyser) aiLevel = readLevel(aiAnalyser, aiData);

      let nextSource: OrbAudioSource = "none";
      let target = 0;

      if (aiSpeaking && aiLevel > 0.02) {
        nextSource = "ai";
        target = Math.max(0.12, aiLevel);
      } else if (aiSpeaking) {
        nextSource = "ai";
        target = 0.18 + Math.sin(Date.now() / 140) * 0.06;
      } else if (userSpeaking && micLevel > 0.03) {
        nextSource = "user";
        target = Math.max(0.1, micLevel);
      } else if (userSpeaking) {
        nextSource = "user";
        target = 0.14;
      } else if (micLevel > 0.06) {
        nextSource = "user";
        target = micLevel;
      }

      const lerp = nextSource === "none" ? 0.12 : 0.28;
      levelRef.current += (target - levelRef.current) * lerp;
      if (nextSource === "none" && levelRef.current < 0.015) levelRef.current = 0;

      setLevel(levelRef.current);
      setSource(levelRef.current > 0.02 ? nextSource : "none");
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.clearInterval(attachTimer);
      void audioCtx?.close();
    };
  }, [active, aiSpeaking, getMicStream, getRemoteAudio, userSpeaking]);

  return { level, source };
}
