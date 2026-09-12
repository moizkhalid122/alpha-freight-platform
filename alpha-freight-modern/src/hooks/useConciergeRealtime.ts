"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatHistoryItem, ConciergeAgentTool } from "@/lib/chat-types";
import { guardAgentTools } from "@/lib/concierge/concierge-tool-guard";
import type { LanguagePreference } from "@/lib/copilot/language";
import { humanizeConciergeText } from "@/lib/concierge/concierge-text";
import { getConciergeIdleDisconnectMs, isFastRealtimeLatencyMode } from "@/lib/concierge/concierge-cost";
import type { ConciergeVoiceMemory } from "@/lib/concierge/concierge-session";
import { isAllowedConciergePath } from "@/lib/concierge/concierge-site-map";
import {
  buildRealtimeAudioInput,
  buildRealtimeInstructions,
} from "@/lib/concierge/realtime-config";

export type RealtimeStatus = "idle" | "connecting" | "listening" | "speaking" | "error";

type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  response?: {
    output?: Array<{
      type?: string;
      name?: string;
      call_id?: string;
      arguments?: string;
    }>;
  };
  item?: {
    role?: string;
    content?: Array<{ transcript?: string; text?: string }>;
  };
};

type PendingFunctionCall = {
  callId: string;
  tools: ConciergeAgentTool[];
};

type RealtimeConnectOptions = {
  lastUserText?: string;
  historyLength?: number;
  signupGuide?: boolean;
  forcePremium?: boolean;
  greetingOverride?: string | null;
};

type UseConciergeRealtimeOptions = {
  pagePath: string;
  language?: LanguagePreference;
  memory?: ConciergeVoiceMemory;
  getLastUserText?: () => string;
  getHistory?: () => ChatHistoryItem[];
  onUserTranscript?: (text: string, isFinal: boolean) => void;
  onAssistantTranscript?: (text: string, isFinal: boolean) => void;
  onToolCall?: (tools: ConciergeAgentTool[]) => void;
  onIdleDisconnect?: () => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
};

function isAudioElementPlaying(audio: HTMLAudioElement | null): boolean {
  if (!audio || audio.paused || audio.ended) return false;
  return audio.currentTime > 0 || !audio.paused;
}

function buildFillFieldsFromArgs(args: Record<string, string>): Record<string, string> {
  const fields: Record<string, string> = {};
  const keys = [
    "fullName",
    "name",
    "email",
    "phone",
    "subject",
    "message",
    "referralCode",
  ] as const;
  for (const key of keys) {
    if (args[key]?.trim()) fields[key] = args[key].trim();
  }
  if (!fields.fullName && fields.name) fields.fullName = fields.name;
  if (!fields.name && fields.fullName) fields.name = fields.fullName;
  return fields;
}

function toolsFromFunctionCall(name: string, argsJson: string): ConciergeAgentTool[] {
  try {
    const args = JSON.parse(argsJson) as Record<string, string>;
    if (name === "navigate_page" && args.path) {
      const path = args.path.trim();
      if (!isAllowedConciergePath(path)) return [];
      return [{ type: "navigate", path, label: args.label }];
    }
    if (name === "fill_page_form" && args.path) {
      const path = args.path.trim();
      if (!isAllowedConciergePath(path)) return [];
      const fields = buildFillFieldsFromArgs(args);
      if (path.includes("/contact")) {
        return [{ type: "fill_field", form: "contact", fields, path: "/contact" }];
      }
      const role = args.role === "supplier" ? "supplier" : "carrier";
      const signupPath = path.includes("signup") ? path : `/auth/signup?role=${role}`;
      return [
        {
          type: "fill_field",
          form: "signup",
          role,
          fields,
          path: signupPath,
        },
      ];
    }
    if (name === "fill_signup_form" && args.role) {
      const fields = buildFillFieldsFromArgs(args);
      const role = args.role === "supplier" ? "supplier" : "carrier";
      return [
        {
          type: "fill_field",
          form: "signup",
          role,
          fields,
          path: `/auth/signup?role=${role}`,
        },
      ];
    }
    if (name === "highlight_element" && args.target) {
      return [{ type: "highlight", target: args.target.trim() }];
    }
    if (name === "click_element" && args.target) {
      const raw = args.target.trim();
      const target =
        raw === "continue" || raw === "createAccount" || raw === "send" ? "submit" : raw === "next" ? "next" : raw;
      return [{ type: "click", target }];
    }
    if (name === "share_referral" && args.role && args.code) {
      const role = args.role === "supplier" ? "supplier" : "carrier";
      return [{ type: "share_referral", role, code: args.code.trim() }];
    }
    if (name === "contact_support") {
      return [{ type: "human_handoff" }];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function isSilentToolBatch(tools: ConciergeAgentTool[]): boolean {
  return (
    tools.length > 0 &&
    tools.every(
      (tool) => tool.type === "navigate" || tool.type === "highlight" || tool.type === "click",
    )
  );
}

async function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }, isFastRealtimeLatencyMode() ? 500 : 3000);
  });
}

function waitForDataChannelOpen(dc: RTCDataChannel, ms = 30000): Promise<void> {
  if (dc.readyState === "open") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error("Voice channel timeout")), ms);
    dc.addEventListener(
      "open",
      () => {
        window.clearTimeout(timeoutId);
        resolve();
      },
      { once: true },
    );
    dc.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeoutId);
        reject(new Error("Voice channel error"));
      },
      { once: true },
    );
  });
}

export function useConciergeRealtime(options: UseConciergeRealtimeOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const assistantBufferRef = useRef("");
  const userBufferRef = useRef("");
  const idleTimerRef = useRef<number | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const pendingFnCallsRef = useRef<PendingFunctionCall[]>([]);
  const assistantSpeakingRef = useRef(false);
  const statusRef = useRef<RealtimeStatus>("idle");
  const disconnectRef = useRef<() => void>(() => {});
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      optionsRef.current.onIdleDisconnect?.();
      disconnectRef.current();
    }, getConciergeIdleDisconnectMs());
  }, [clearIdleTimer]);

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  statusRef.current = status;

  const sendEvent = useCallback((event: Record<string, unknown>) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify(event));
  }, []);

  const waitForAudioPlaybackEnd = useCallback(async (maxMs = 14000) => {
    const audio = audioRef.current;
    if (!isAudioElementPlaying(audio)) return;

    await new Promise<void>((resolve) => {
      const finish = () => {
        audio?.removeEventListener("ended", finish);
        audio?.removeEventListener("pause", finish);
        resolve();
      };
      audio?.addEventListener("ended", finish, { once: true });
      audio?.addEventListener("pause", finish, { once: true });
      window.setTimeout(finish, maxMs);
    });
  }, []);

  const flushPendingFunctionCalls = useCallback(async () => {
    const batch = pendingFnCallsRef.current.splice(0);
    if (!batch.length) return;

    const navigateOnly = batch.every((item) =>
      item.tools.length > 0 && item.tools.every((tool) => tool.type === "navigate"),
    );
    const silentOnly = batch.every((item) => isSilentToolBatch(item.tools));

    if (
      !navigateOnly &&
      !silentOnly &&
      (assistantSpeakingRef.current || statusRef.current === "speaking")
    ) {
      pendingFnCallsRef.current.unshift(...batch);
      return;
    }

    if (!navigateOnly && !silentOnly) {
      const fast = isFastRealtimeLatencyMode();
      await waitForAudioPlaybackEnd(fast ? 6000 : 14000);
      await new Promise((r) => window.setTimeout(r, fast ? 60 : 280));
    }

    for (const { callId, tools } of batch) {
      if (tools.length) optionsRef.current.onToolCall?.(tools);
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({
            success: true,
            message: tools.length ? "Page opened on the website." : "Done.",
          }),
        },
      });

      const needsFollowUp = tools.some(
        (tool) =>
          tool.type === "fill_field" ||
          tool.type === "human_handoff" ||
          tool.type === "share_referral" ||
          tool.type === "click",
      );
      if (needsFollowUp) {
        sendEvent({ type: "response.create" });
      }
    }
  }, [sendEvent, waitForAudioPlaybackEnd]);

  const scheduleFlushPending = useCallback(() => {
    if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
    const fast = isFastRealtimeLatencyMode();
    const pending = pendingFnCallsRef.current;
    const hasNavigate = pending.some((item) => item.tools.some((tool) => tool.type === "navigate"));
    const hasSilent = pending.every((item) => isSilentToolBatch(item.tools));
    const delay =
      hasSilent || (hasNavigate && !assistantSpeakingRef.current)
        ? 0
        : assistantSpeakingRef.current || statusRef.current === "speaking"
          ? fast
            ? 120
            : 650
          : fast
            ? 40
            : 280;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      void flushPendingFunctionCalls();
    }, delay);
  }, [flushPendingFunctionCalls]);

  const waitUntilSpeechIdle = useCallback(async (maxMs = 18000) => {
    const started = Date.now();
    while (Date.now() - started < maxMs) {
      const audioBusy = isAudioElementPlaying(audioRef.current);
      if (!assistantSpeakingRef.current && statusRef.current !== "speaking" && !audioBusy) {
        await new Promise((r) => window.setTimeout(r, isFastRealtimeLatencyMode() ? 120 : 500));
        return;
      }
      await new Promise((r) => window.setTimeout(r, isFastRealtimeLatencyMode() ? 60 : 120));
    }
  }, []);

  const handleServerEvent = useCallback(
    (event: RealtimeEvent) => {
      resetIdleTimer();
      const type = event.type || "";

      if (type === "input_audio_buffer.speech_started") {
        if (assistantSpeakingRef.current || statusRef.current === "speaking") {
          sendEvent({ type: "response.cancel" });
          assistantSpeakingRef.current = false;
          assistantBufferRef.current = "";
          setStatus("listening");
        }
        userBufferRef.current = "";
        setStatus("listening");
        optionsRef.current.onSpeechStarted?.();
      }

      if (
        (type === "conversation.item.input_audio_transcription.delta" ||
          type.endsWith(".input_audio_transcription.delta")) &&
        event.delta
      ) {
        userBufferRef.current += event.delta;
        optionsRef.current.onUserTranscript?.(userBufferRef.current.trim(), false);
      }

      if (
        type === "conversation.item.input_audio_transcription.completed" ||
        type.endsWith(".input_audio_transcription.completed")
      ) {
        const finalUser = (event.transcript || userBufferRef.current).trim();
        userBufferRef.current = "";
        if (finalUser) optionsRef.current.onUserTranscript?.(finalUser, true);
      }

      if (type === "input_audio_buffer.speech_stopped") {
        optionsRef.current.onSpeechStopped?.();
      }

      if (type === "response.output_audio_transcript.delta" && event.delta) {
        assistantSpeakingRef.current = true;
        assistantBufferRef.current += event.delta;
        setStatus("speaking");
        optionsRef.current.onAssistantTranscript?.(
          humanizeConciergeText(assistantBufferRef.current),
          false,
        );
      }

      if (
        type === "response.output_audio_transcript.done" ||
        type === "response.output_audio.done"
      ) {
        if (type === "response.output_audio_transcript.done") {
          const finalText = humanizeConciergeText(
            event.transcript || assistantBufferRef.current,
          );
          assistantBufferRef.current = "";
          if (finalText) {
            optionsRef.current.onAssistantTranscript?.(finalText, true);
          }
        }
        assistantSpeakingRef.current = false;
        setStatus("listening");
        scheduleFlushPending();
      }

      if (type === "response.done" && event.response?.output) {
        for (const item of event.response.output) {
          if (item.type !== "function_call" || !item.name || !item.call_id) continue;
          const rawTools = toolsFromFunctionCall(item.name, item.arguments || "{}");
          const tools = guardAgentTools(rawTools, optionsRef.current.getLastUserText?.() || "", {
            pagePath: optionsRef.current.pagePath,
            history: optionsRef.current.getHistory?.() || [],
          });
          pendingFnCallsRef.current.push({ callId: item.call_id, tools });
        }
        if (pendingFnCallsRef.current.length) scheduleFlushPending();
        setStatus("listening");
      }

      if (type === "error") {
        setStatus("error");
        setError("Voice session error");
      }
    },
    [resetIdleTimer, scheduleFlushPending, sendEvent],
  );

  const bindDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      if (dcRef.current && dcRef.current !== dc && dcRef.current.readyState !== "closed") return;
      dcRef.current = dc;
      dc.onmessage = (message) => {
        try {
          handleServerEvent(JSON.parse(message.data) as RealtimeEvent);
        } catch {
          /* ignore */
        }
      };
    },
    [handleServerEvent],
  );

  const disconnect = useCallback(() => {
    clearIdleTimer();
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingFnCallsRef.current = [];
    assistantSpeakingRef.current = false;
    dcRef.current?.close();
    pcRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.remove();
      audioRef.current = null;
    }
    pcRef.current = null;
    dcRef.current = null;
    assistantBufferRef.current = "";
    userBufferRef.current = "";
    setStatus("idle");
    setError(null);
  }, [clearIdleTimer]);

  disconnectRef.current = disconnect;

  const updateSession = useCallback(
    (patch: {
      language?: LanguagePreference;
      pagePath?: string;
      memory?: ConciergeVoiceMemory;
      signupGuide?: boolean;
      greetingOverride?: string | null;
    }) => {
      const language = patch.language || optionsRef.current.language || "english";
      const pagePath = patch.pagePath || optionsRef.current.pagePath || "/";
      const memory = patch.memory || optionsRef.current.memory;

      sendEvent({
        type: "session.update",
        session: {
          type: "realtime",
          instructions: buildRealtimeInstructions(language, pagePath, {
            memory,
            signupGuide: patch.signupGuide,
            greetingOverride: patch.greetingOverride,
          }),
          audio: {
            input: buildRealtimeAudioInput(
              memory?.detectedLanguage || language,
            ),
          },
        },
      });
    },
    [sendEvent],
  );

  const connect = useCallback(async (connectOptions: RealtimeConnectOptions = {}) => {
    disconnect();
    setStatus("connecting");
    setError(null);

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      document.body.appendChild(audio);
      audioRef.current = audio;

      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        void audio.play().catch(() => {});
      };

      pc.ondatachannel = (event) => {
        if (event.channel.label === "oai-events") {
          bindDataChannel(event.channel);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const dc = pc.createDataChannel("oai-events");
      bindDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const tokenResponsePromise = fetch("/api/voice/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath: optionsRef.current.pagePath,
          language: optionsRef.current.language || "english",
          memory: optionsRef.current.memory,
          lastUserText: connectOptions.lastUserText,
          historyLength: connectOptions.historyLength,
          signupGuide: connectOptions.signupGuide,
          forcePremium: connectOptions.forcePremium,
        }),
      });

      await waitForIceGathering(pc);

      const tokenResponse = await tokenResponsePromise;
      const tokenPayload = (await tokenResponse.json()) as {
        token?: string;
        error?: string;
        model?: string;
      };
      if (!tokenResponse.ok || !tokenPayload.token) {
        throw new Error(tokenPayload.error || "Could not start voice session");
      }

      const sdpOffer = pc.localDescription?.sdp || offer.sdp || "";
      const response = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenPayload.token}`,
          "Content-Type": "application/sdp",
        },
        body: sdpOffer,
      });

      const answerSdp = await response.text();
      if (!response.ok || !answerSdp.trim().startsWith("v=0")) {
        let message = "Realtime connection failed";
        try {
          const parsed = JSON.parse(answerSdp) as { error?: { message?: string } };
          if (parsed.error?.message) message = parsed.error.message.slice(0, 120);
        } catch {
          if (answerSdp.includes("504")) message = "Voice server timeout";
        }
        throw new Error(message);
      }

      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      const activeDc = dcRef.current ?? dc;
      await waitForDataChannelOpen(activeDc);

      const language = optionsRef.current.language || "english";
      const pagePath = optionsRef.current.pagePath || "/";
      const memory = optionsRef.current.memory;
      updateSession({
        language,
        pagePath,
        memory,
        signupGuide: connectOptions.signupGuide,
      });

      setStatus("listening");
      resetIdleTimer();
      if (connectOptions.signupGuide) {
        sendEvent({
          type: "response.create",
          response: {
            instructions:
              "The signup form was just pre-filled. In one warm natural sentence: choose a password, tap Create Account, then continue normal Alpha onboarding. Never mention email verification unless the form shows that error.",
          },
        });
      } else if (connectOptions.greetingOverride) {
        sendEvent({
          type: "response.create",
          response: {
            instructions: `Say warmly in one breath: "${connectOptions.greetingOverride}" — then listen. Do NOT use any tools on this first reply.`,
          },
        });
      } else {
        sendEvent({
          type: "response.create",
          response: {
            instructions:
              "Greet the user warmly on the CURRENT PAGE in context. Speech only — do NOT call any tools. Then listen.",
          },
        });
      }
    } catch (err) {
      disconnect();
      setStatus("error");
      const message = err instanceof Error ? err.message : "Could not start voice session";
      setError(message);
      throw err;
    }
  }, [bindDataChannel, disconnect, resetIdleTimer, sendEvent, updateSession]);

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: trimmed }],
        },
      });
      sendEvent({ type: "response.create" });
    },
    [sendEvent],
  );

  const speakGuide = useCallback(
    (instructions: string) => {
      sendEvent({
        type: "response.create",
        response: { instructions },
      });
    },
    [sendEvent],
  );

  const getMicStream = useCallback(() => mediaStreamRef.current, []);
  const getRemoteAudio = useCallback(() => audioRef.current, []);

  return {
    connect,
    disconnect,
    sendText,
    speakGuide,
    updateSession,
    waitUntilSpeechIdle,
    getMicStream,
    getRemoteAudio,
    status,
    error,
    isActive: status !== "idle" && status !== "error",
  };
}
