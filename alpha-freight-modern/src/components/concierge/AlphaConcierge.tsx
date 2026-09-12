"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import ConciergeCelebration from "@/components/concierge/ConciergeCelebration";
import ConciergeVoiceOrb, { type ConciergeOrbMode } from "@/components/concierge/ConciergeVoiceOrb";
import { CONCIERGE_GREETING_TEXT, useConciergeVoice } from "@/hooks/useConciergeVoice";
import { useConciergeAgent } from "@/hooks/useConciergeAgent";
import { useConciergeStreamVoice } from "@/hooks/useConciergeStreamVoice";
import { useConciergeRealtime } from "@/hooks/useConciergeRealtime";
import { streamPublicChatMessage } from "@/lib/api";
import {
  buildConciergeAgentTools,
  buildConciergeInstantActions,
  buildContactFieldFillTools,
  buildSignupFieldFillTools,
} from "@/lib/concierge/concierge-agent";
import { useConciergeDisplayStt } from "@/hooks/useConciergeDisplayStt";
import { guardAgentTools } from "@/lib/concierge/concierge-tool-guard";
import {
  isBudgetRealtimeEnabled,
  isVipPremiumVoiceEnabled,
  shouldUseRealtimeVoice,
  shouldUseWhisperStt,
} from "@/lib/concierge/concierge-cost";
import { useConciergeBrowserStt } from "@/hooks/useConciergeBrowserStt";
import { useConciergeWhisperStt } from "@/hooks/useConciergeWhisperStt";
import { getConciergeInstantTurn } from "@/lib/concierge/concierge-instant";
import {
  disableConciergeCompanion,
  readConciergeCaptions,
  readConciergeCompanion,
  saveConciergeCaptions,
  CONCIERGE_CELEBRATE_EVENT,
  CONCIERGE_COMPANION_EVENT,
  CONCIERGE_ONBOARDING_CONTEXT_EVENT,
  CONCIERGE_SIGNUP_COMPLETE_EVENT,
  enableConciergeCompanion,
} from "@/lib/concierge/concierge-companion";
import { buildOnboardingProactiveMessage } from "@/lib/concierge/concierge-onboarding";
import type { ConciergeOnboardingContext } from "@/lib/concierge/concierge-onboarding";
import { searchConciergeKnowledge } from "@/lib/concierge/concierge-knowledge";
import { getProactiveNudge } from "@/lib/concierge/concierge-proactive";
import { buildVipConciergeGreeting } from "@/lib/concierge/concierge-vip";
import { useConciergeEmotion } from "@/hooks/useConciergeEmotion";
import { useConciergeDomActions } from "@/hooks/useConciergeDomActions";
import { useConciergeMemorySync } from "@/hooks/useConciergeMemorySync";
import type { ConciergeUserEmotion } from "@/lib/concierge/concierge-emotion";
import { humanizeConciergeText, stripConciergeFormatting } from "@/lib/concierge/concierge-text";
import { speechForConcierge } from "@/lib/concierge-speech";
import {
  detectSpokenLanguagePreference,
  mergeLanguagePreference,
} from "@/lib/concierge/concierge-language-detect";
import { scoreRealtimeComplexity } from "@/lib/concierge/concierge-realtime-router";
import {
  buildSignupGuideHint,
  CONCIERGE_SIGNUP_GUIDE_EVENT,
} from "@/lib/concierge/concierge-signup-guide";
import {
  loadConciergeMemory,
  saveConciergeMemory,
  updateConciergeMemoryFromTurn,
  type ConciergeVoiceMemory,
} from "@/lib/concierge/concierge-session";
import type { ChatHistoryItem } from "@/lib/chat-types";
import {
  getChatLanguagePreference,
  SITE_LOCALE_CHANGE_EVENT,
} from "@/lib/site-language-preference";
import type { LanguagePreference } from "@/lib/copilot/language";
import { shouldHideConciergeWidget } from "@/lib/concierge/concierge-visibility";

const orbSpring = { type: "spring" as const, stiffness: 340, damping: 32, mass: 0.88 };
const textEase = [0.22, 1, 0.36, 1] as const;

const PREFETCH_REPLY_SNIPPETS = [
  CONCIERGE_GREETING_TEXT,
  "Lovely — carrier signup takes about a minute. I'm opening it for you now.",
  "Got it — filling in your name and email now.",
  "Let me pull up available loads for you — opening that now.",
  "On it — opening that page for you now.",
] as const;

type CaptionState = {
  text: string;
  role: "assistant" | "user";
  key: number;
};

type VoiceMode = "realtime" | "legacy" | null;

export default function AlphaConcierge() {
  const pathname = usePathname();
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [caption, setCaption] = useState<CaptionState | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<LanguagePreference>(() => {
    const mem = loadConciergeMemory();
    return mem.detectedLanguage || getChatLanguagePreference();
  });
  const [sessionMemory, setSessionMemory] = useState<ConciergeVoiceMemory>(() => loadConciergeMemory());
  const [liveUserText, setLiveUserText] = useState("");
  const [liveAssistantText, setLiveAssistantText] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isCompanion, setIsCompanion] = useState(() =>
    typeof window !== "undefined" ? readConciergeCompanion().active : false,
  );
  const [realtimePaused, setRealtimePaused] = useState(false);
  const [userSpeechActive, setUserSpeechActive] = useState(false);
  const [turnTexts, setTurnTexts] = useState<{ user: string | null; assistant: string | null }>(() => {
    const stored = typeof window !== "undefined" ? readConciergeCaptions() : null;
    return { user: stored?.user ?? null, assistant: stored?.assistant ?? null };
  });
  const [chatMessages, setChatMessages] = useState<ChatHistoryItem[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isCelebrating, setIsCelebrating] = useState(false);

  const captionKeyRef = useRef(0);
  const proactiveFiredRef = useRef<Set<string>>(new Set());
  const lastActivityRef = useRef(Date.now());
  const lastAppliedEmotionRef = useRef<ConciergeUserEmotion>("neutral");
  const voiceModeRef = useRef<VoiceMode>(null);
  voiceModeRef.current = voiceMode;
  const chatLanguageRef = useRef(chatLanguage);
  chatLanguageRef.current = chatLanguage;
  const sessionMemoryRef = useRef(sessionMemory);
  sessionMemoryRef.current = sessionMemory;
  const historyRef = useRef<ChatHistoryItem[]>([]);
  const hasGreetedRef = useRef(false);
  const sessionBusyRef = useRef(false);
  const openRef = useRef(false);
  const lastUserTextRef = useRef("");
  const handleUserMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const realtimeRef = useRef<ReturnType<typeof useConciergeRealtime> | null>(null);

  const {
    speakAsync,
    speakGreeting,
    preloadGreeting,
    prefetchSpeech,
    stop,
    unlockAudio,
    waitUntilIdle,
    isSpeaking,
    isSpeakingRef,
  } = useConciergeVoice();
  const { executeAgentTools } = useConciergeAgent();
  useConciergeDomActions();
  const { syncFromServer } = useConciergeMemorySync(pathname);
  const {
    emotion: userEmotion,
    onSpeechStarted: onEmotionSpeechStarted,
    onSpeechStopped: onEmotionSpeechStopped,
    analyzeTranscript: analyzeUserEmotion,
    resetEmotion,
  } = useConciergeEmotion();
  const browserStt = useConciergeBrowserStt();
  const browserSttRef = useRef(browserStt);
  browserSttRef.current = browserStt;
  const whisperStt = useConciergeWhisperStt();
  const displayStt = useConciergeDisplayStt();
  const { onStreamComplete, resetStreamVoice } = useConciergeStreamVoice({ speakAsync, stop });
  const stopVoiceRef = useRef(stop);
  stopVoiceRef.current = stop;

  const setTurnCaption = useCallback((text: string, role: "assistant" | "user", newTurn = true) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (newTurn) captionKeyRef.current += 1;
    setCaption({ text: trimmed, role, key: captionKeyRef.current });
    setTurnTexts((prev) => {
      const next = {
        ...prev,
        [role]: trimmed,
      } as { user: string | null; assistant: string | null };
      saveConciergeCaptions(next.user, next.assistant);
      return next;
    });
  }, []);

  const pushChatMessage = useCallback((role: "user" | "assistant", content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [...prev, { role, content: trimmed }].slice(-24));
    lastActivityRef.current = Date.now();
  }, []);

  const applyMemoryFromUser = useCallback(
    (userText: string, assistantText = "") => {
      setSessionMemory((prev) => {
        const snippets = searchConciergeKnowledge(`${userText} ${assistantText}`);
        const next = updateConciergeMemoryFromTurn(
          { ...prev, knowledgeSnippets: snippets.length ? snippets : prev.knowledgeSnippets },
          userText,
          assistantText,
        );
        saveConciergeMemory(next);
        return next;
      });
    },
    [],
  );

  const runInstantActions = useCallback(
    (message: string, emotion: ConciergeUserEmotion = "neutral") => {
      const instantTools = guardAgentTools(
        buildConciergeInstantActions({
          message,
          history: historyRef.current.slice(0, -1),
          pagePath: pathname,
          memory: sessionMemoryRef.current,
        }),
        message,
        { pagePath: pathname, history: historyRef.current.slice(-6) },
      );
      if (instantTools.length) {
        void executeAgentTools(instantTools, { delayMs: emotion === "frustrated" ? 0 : 0 });
      }
    },
    [executeAgentTools, pathname],
  );

  const applyUserEmotion = useCallback(
    (text: string, isFinal: boolean) => {
      const nextEmotion = analyzeUserEmotion(text, isFinal);
      if (nextEmotion === lastAppliedEmotionRef.current) return nextEmotion;
      lastAppliedEmotionRef.current = nextEmotion;

      setSessionMemory((prev) => {
        const next = { ...prev, userEmotion: nextEmotion };
        saveConciergeMemory(next);
        return next;
      });

      if (
        nextEmotion === "frustrated" &&
        voiceModeRef.current === "realtime" &&
        realtimeRef.current?.isActive
      ) {
        realtimeRef.current.updateSession({
          pagePath: pathname,
          memory: { ...sessionMemoryRef.current, userEmotion: nextEmotion },
          language: chatLanguageRef.current,
        });
      }

      return nextEmotion;
    },
    [analyzeUserEmotion, pathname],
  );

  const [pendingLanguage, setPendingLanguage] = useState<LanguagePreference | null>(null);

  const realtime = useConciergeRealtime({
    pagePath: pathname,
    language: chatLanguage,
    memory: sessionMemory,
    getLastUserText: () => lastUserTextRef.current,
    getHistory: () => historyRef.current,
    onSpeechStarted: () => {
      setUserSpeechActive(true);
      onEmotionSpeechStarted();
    },
    onSpeechStopped: () => {
      setUserSpeechActive(false);
      onEmotionSpeechStopped();
    },
    onUserTranscript: (text, isFinal) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!isFinal) {
        setLiveUserText(trimmed);
        setIsUserTyping(true);
        analyzeUserEmotion(trimmed, false);
        return;
      }
      setIsUserTyping(false);
      setLiveUserText("");
      lastUserTextRef.current = trimmed;
      setTurnCaption(trimmed, "user", true);
      historyRef.current = ([...historyRef.current, { role: "user" as const, content: trimmed }]).slice(-12);
      pushChatMessage("user", trimmed);
      applyMemoryFromUser(trimmed);
      const detectedEmotion = applyUserEmotion(trimmed, true);

      const snippets = searchConciergeKnowledge(trimmed);
      if (snippets.length) {
        setSessionMemory((prev) => {
          const next = { ...prev, knowledgeSnippets: snippets };
          saveConciergeMemory(next);
          return next;
        });
      }

      if (voiceModeRef.current === "realtime") {
        runInstantActions(trimmed, detectedEmotion);
      }
      const detected = detectSpokenLanguagePreference(trimmed);
      if (detected) {
        const merged = mergeLanguagePreference(chatLanguageRef.current, detected);
        if (merged !== chatLanguageRef.current) {
          setChatLanguage(merged);
          setPendingLanguage(merged);
          setSessionMemory((prev) => {
            const next = { ...prev, detectedLanguage: merged };
            saveConciergeMemory(next);
            return next;
          });
        }
      }
    },
    onAssistantTranscript: (text, isFinal) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!isFinal) {
        setLiveAssistantText(trimmed);
        setCaption((prev) =>
          prev?.role === "assistant"
            ? { ...prev, text: trimmed }
            : { text: trimmed, role: "assistant", key: captionKeyRef.current },
        );
        return;
      }
      setLiveAssistantText("");
      setTurnCaption(trimmed, "assistant", true);
      pushChatMessage("assistant", trimmed);
      if (lastUserTextRef.current) {
        applyMemoryFromUser(lastUserTextRef.current, trimmed);
      }
    },
    onToolCall: (tools) => {
      const guarded = guardAgentTools(tools, lastUserTextRef.current, {
        pagePath: pathname,
        history: historyRef.current.slice(-6),
      });
      if (guarded.length) {
        void executeAgentTools(guarded, { delayMs: 0 });
      }
    },
    onIdleDisconnect: () => {
      if (!isBudgetRealtimeEnabled()) return;
      setRealtimePaused(true);
      setTurnCaption("Tap orb when you're ready.", "assistant", true);
    },
  });
  realtimeRef.current = realtime;

  const handleSendText = useCallback(
    (raw?: string) => {
      const trimmed = (raw ?? textInput).trim();
      if (!trimmed || sessionBusyRef.current) return;
      setTextInput("");
      lastActivityRef.current = Date.now();

      if (voiceModeRef.current === "realtime" && realtimeRef.current?.isActive) {
        pushChatMessage("user", trimmed);
        setTurnCaption(trimmed, "user", true);
        historyRef.current = ([...historyRef.current, { role: "user" as const, content: trimmed }]).slice(-12);
        applyMemoryFromUser(trimmed);
        const detectedEmotion = applyUserEmotion(trimmed, true);
        runInstantActions(trimmed, detectedEmotion);
        realtimeRef.current.sendText(trimmed);
        return;
      }

      void handleUserMessageRef.current(trimmed);
    },
    [applyMemoryFromUser, pushChatMessage, runInstantActions, setTurnCaption, textInput],
  );

  const dockCompanion = useCallback(() => {
    enableConciergeCompanion(pathname);
    setIsCompanion(true);
    setSessionActive(true);
    openRef.current = true;
  }, [pathname]);

  const buildConnectOptions = useCallback(() => {
    const lastUser = lastUserTextRef.current;
    const mem = sessionMemoryRef.current;
    const complex = scoreRealtimeComplexity({
      lastUserText: lastUser,
      historyLength: historyRef.current.length,
      memory: mem,
      pagePath: pathname,
    });
    const greetingOverride = buildVipConciergeGreeting(mem, pathname);
    return {
      lastUserText: lastUser,
      historyLength: historyRef.current.length,
      signupGuide: pathname.includes("/auth/signup") && mem.signupStage === "form_filled",
      forcePremium: isVipPremiumVoiceEnabled() || complex >= 5,
      greetingOverride,
    };
  }, [pathname]);

  const resumeRealtimeFromCompanion = useCallback(async () => {
    if (sessionBusyRef.current || !shouldUseRealtimeVoice()) return;
    if (realtime.isActive) return;

    try {
      setTurnCaption("Reconnecting…", "assistant", true);
      await realtime.connect(buildConnectOptions());
      setRealtimePaused(false);
      setVoiceMode("realtime");
      setSessionActive(true);
      if (sessionMemory.pendingSignupGuide) {
        setSessionMemory((prev) => {
          const next = { ...prev, pendingSignupGuide: false };
          saveConciergeMemory(next);
          return next;
        });
      }
    } catch {
      setTurnCaption("Tap orb to talk again.", "assistant", true);
    }
  }, [buildConnectOptions, realtime, sessionMemory.pendingSignupGuide, setTurnCaption]);

  const hideWidget = shouldHideConciergeWidget(pathname);

  const isRealtime = voiceMode === "realtime";
  const voiceSessionLive = isCompanion || sessionActive;

  const orbMode: ConciergeOrbMode = isRealtime
    ? realtime.status === "connecting"
      ? "thinking"
      : realtime.status === "speaking"
        ? "speaking"
        : realtime.status === "listening"
          ? "listening"
          : "idle"
    : isSpeaking
      ? "speaking"
      : isThinking
        ? "thinking"
        : isListening
          ? "listening"
          : "idle";

  const prefetchInstantVoice = useCallback(() => {
    for (const snippet of PREFETCH_REPLY_SNIPPETS) {
      prefetchSpeech(speechForConcierge(snippet));
    }
  }, [prefetchSpeech]);

  const stopListening = useCallback(() => {
    browserStt.stop();
    whisperStt.stopListening();
    setIsListening(false);
  }, [browserStt, whisperStt]);

  const startListeningRef = useRef<() => void>(() => {});

  const startListening = useCallback(() => {
    if (sessionBusyRef.current || !openRef.current) return;

    if (shouldUseWhisperStt() && voiceMode === "legacy") {
      void whisperStt.startListening({
        onInterim: (text) => {
          if (!openRef.current || sessionBusyRef.current) return;
          setCaption((prev) =>
            prev?.role === "user"
              ? { ...prev, text }
              : { text, role: "user", key: ++captionKeyRef.current },
          );
        },
        onFinal: (text) => {
          setIsListening(false);
          if (isSpeakingRef.current && text.length > 2) stopVoiceRef.current();
          void handleUserMessageRef.current(text);
        },
        onError: () => {
          setIsListening(false);
          window.setTimeout(() => startListeningRef.current(), 400);
        },
      }).then((started) => setIsListening(started));
      return;
    }

    void browserStt.start();
  }, [browserStt, voiceMode, whisperStt]);

  startListeningRef.current = startListening;

  const openLegacySession = useCallback(async () => {
    setVoiceMode("legacy");
    setSessionActive(true);

    if (hasGreetedRef.current) {
      startListening();
      return;
    }

    hasGreetedRef.current = true;
    const greeting =
      buildVipConciergeGreeting(sessionMemoryRef.current, pathname) ||
      "Hi, I'm Alpha — VIP freight concierge. How can I help?";
    setTurnCaption(greeting, "assistant", true);
    pushChatMessage("assistant", greeting);
    if (greeting === CONCIERGE_GREETING_TEXT) {
      await speakGreeting();
    } else {
      await speakAsync(speechForConcierge(greeting));
    }
    if (openRef.current) startListening();
  }, [pathname, pushChatMessage, setTurnCaption, speakAsync, speakGreeting, startListening]);

  const handleUserMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || sessionBusyRef.current || !openRef.current) return;

      sessionBusyRef.current = true;
      setIsBusy(true);
      setSessionActive(true);
      setIsThinking(true);
      stopListening();
      resetStreamVoice();
      setTurnCaption(trimmed, "user", true);
      pushChatMessage("user", trimmed);
      applyUserEmotion(trimmed, true);

      historyRef.current = ([...historyRef.current, { role: "user" as const, content: trimmed }]).slice(-12);

      const signupFieldTools = buildSignupFieldFillTools({
        message: trimmed,
        history: historyRef.current.slice(0, -1),
        pagePath: pathname,
      });
      const contactFieldTools = buildContactFieldFillTools({
        message: trimmed,
        history: historyRef.current.slice(0, -1),
        pagePath: pathname,
      });
      const pageFieldTools = signupFieldTools.length ? signupFieldTools : contactFieldTools;
      if (pageFieldTools.length) {
        void executeAgentTools(pageFieldTools, { delayMs: 0 });
        const fillTool = pageFieldTools[0];
        const fields = fillTool?.type === "fill_field" ? fillTool.fields : {};
        const parts: string[] = [];
        if (fields.fullName || fields.name) parts.push("name");
        if (fields.email) parts.push("email");
        if (fields.phone) parts.push("phone");
        if (fields.message) parts.push("message");
        if (fields.referralCode) parts.push("referral code");
        const reply = parts.length
          ? `Got it — filling in your ${parts.join(" and ")} now.`
          : "Got it — updating the form for you.";
        setIsThinking(false);
        setTurnCaption(reply, "assistant", true);
        const spokenReply = speechForConcierge(reply);
        prefetchSpeech(spokenReply);
        speakAsync(spokenReply);
        historyRef.current = ([
          ...historyRef.current,
          { role: "assistant" as const, content: reply },
        ]).slice(-12);
        sessionBusyRef.current = false;
        setIsBusy(false);
        void waitUntilIdle().then(() => {
          if (openRef.current && voiceMode === "legacy" && voiceSessionLive) startListening();
        });
        return;
      }

      const instantTurn = getConciergeInstantTurn(trimmed, historyRef.current.slice(0, -1));
      if (instantTurn) {
        setIsThinking(false);
        setTurnCaption(instantTurn.message, "assistant", true);
        const spokenInstant = speechForConcierge(instantTurn.message);
        prefetchSpeech(spokenInstant);
        speakAsync(spokenInstant);
        historyRef.current = ([
          ...historyRef.current,
          { role: "assistant" as const, content: instantTurn.message },
        ]).slice(-12);
        void executeAgentTools(instantTurn.agentTools, { delayMs: 60 });
        sessionBusyRef.current = false;
        setIsBusy(false);
        void waitUntilIdle().then(() => {
          if (openRef.current && voiceMode === "legacy" && voiceSessionLive) startListening();
        });
        return;
      }

      let assistantTurnStarted = false;
      let finalMessage = "";

      try {
        const aiResponse = await streamPublicChatMessage(
          trimmed,
          {
            assistantType: "general",
            history: historyRef.current.slice(0, -1),
            language: chatLanguage,
            sessionMemory,
            conciergeMode: true,
            pagePath: pathname,
          },
          {
            onToken: (_delta, fullText) => {
              if (!fullText.trim()) return;
              setIsThinking(false);
              setTurnCaption(stripConciergeFormatting(fullText), "assistant", !assistantTurnStarted);
              assistantTurnStarted = true;
            },
            onDone: (result) => {
              finalMessage = result.message?.trim() || "";
            },
          },
        );

        finalMessage = humanizeConciergeText(aiResponse.message?.trim() || finalMessage);
        if (finalMessage) {
          historyRef.current = ([
            ...historyRef.current,
            { role: "assistant" as const, content: finalMessage },
          ]).slice(-12);
          pushChatMessage("assistant", finalMessage);

          setTurnCaption(finalMessage, "assistant", !assistantTurnStarted);

          if (assistantTurnStarted) {
            onStreamComplete(finalMessage);
          } else {
            speakAsync(speechForConcierge(finalMessage));
          }

          const nextMemory = updateConciergeMemoryFromTurn(sessionMemory, trimmed, finalMessage);
          setSessionMemory(nextMemory);
          saveConciergeMemory(nextMemory);

          const tools = aiResponse.structuredMessage?.agentTools;
          if (tools?.length) void executeAgentTools(tools, { delayMs: 250 });
        }
      } catch {
        setTurnCaption("Sorry, something went wrong. Please try again.", "assistant", true);
        speakAsync(speechForConcierge("Sorry, something went wrong. Please try again."));
      } finally {
        setIsThinking(false);
        sessionBusyRef.current = false;
        setIsBusy(false);
        void waitUntilIdle().then(() => {
          if (openRef.current && voiceMode === "legacy" && voiceSessionLive) startListening();
        });
      }
    },
    [
      chatLanguage,
      executeAgentTools,
      onStreamComplete,
      pathname,
      pushChatMessage,
      resetStreamVoice,
      sessionMemory,
      setTurnCaption,
      speakAsync,
      startListening,
      stopListening,
      voiceMode,
      voiceSessionLive,
      waitUntilIdle,
    ],
  );

  handleUserMessageRef.current = handleUserMessage;

  const openConcierge = useCallback(() => {
    unlockAudio();
    dockCompanion();
    if (!shouldUseRealtimeVoice()) {
      preloadGreeting();
      prefetchInstantVoice();
    }
    setVoiceMode(null);

    const onSignupPage = pathname.includes("/auth/signup");
    setSessionMemory((prev) => {
      const next: ConciergeVoiceMemory = {
        ...prev,
        pendingSignupGuide: onSignupPage && prev.signupStage === "form_filled",
      };
      if (!onSignupPage) {
        next.pendingSignupGuide = false;
        if (prev.signupStage === "form_filled") next.signupStage = null;
      }
      saveConciergeMemory(next);
      return next;
    });

    void (async () => {
      void syncFromServer().then((merged) => setSessionMemory(merged));

      if (!shouldUseRealtimeVoice()) {
        setVoiceMode("legacy");
        await openLegacySession();
        return;
      }

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await realtime.connect(buildConnectOptions());
          setVoiceMode("realtime");
          setRealtimePaused(false);
          setSessionActive(true);
          setLiveUserText("");
          setLiveAssistantText("");
          setCaption(null);
          return;
        } catch {
          realtime.disconnect();
          if (attempt === 0) {
            await new Promise((r) => window.setTimeout(r, 120));
          }
        }
      }

      setTurnCaption("Premium voice reconnecting — one moment.", "assistant", true);
      setVoiceMode("legacy");
      await openLegacySession();
    })();
  }, [buildConnectOptions, dockCompanion, openLegacySession, pathname, prefetchInstantVoice, preloadGreeting, realtime, syncFromServer, unlockAudio]);

  const closeConcierge = useCallback(() => {
    if (voiceMode === "realtime") realtime.disconnect();
    stop();
    resetStreamVoice();
    stopListening();
    disableConciergeCompanion();
    displayStt.stop();
    resetEmotion();
    lastAppliedEmotionRef.current = "neutral";
    openRef.current = false;
    sessionBusyRef.current = false;
    setVoiceMode(null);
    setIsCompanion(false);
    setRealtimePaused(false);
    setSessionActive(false);
    setUserSpeechActive(false);
    setIsThinking(false);
    setCaption(null);
  }, [displayStt, realtime, resetEmotion, resetStreamVoice, stop, stopListening, voiceMode]);

  useEffect(() => {
    setChatLanguage(getChatLanguagePreference());
    const onLocaleChange = () => setChatLanguage(getChatLanguagePreference());
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);
  }, []);

  useEffect(() => {
    const syncCompanion = () => {
      const state = readConciergeCompanion();
      setIsCompanion(state.active);
      if (state.active) {
        openRef.current = true;
        setSessionActive(true);
        const stored = readConciergeCaptions();
        if (stored?.user || stored?.assistant) {
          setTurnTexts({ user: stored.user, assistant: stored.assistant });
          const text = stored.assistant || stored.user || "";
          const role = stored.assistant ? "assistant" : "user";
          if (text) {
            captionKeyRef.current += 1;
            setCaption({ text, role, key: captionKeyRef.current });
          }
        }
      }
    };

    syncCompanion();
    window.addEventListener(CONCIERGE_COMPANION_EVENT, syncCompanion);
    return () => window.removeEventListener(CONCIERGE_COMPANION_EVENT, syncCompanion);
  }, []);

  useEffect(() => {
    const state = readConciergeCompanion();
    if (state.active) setIsCompanion(true);
  }, [pathname]);

  useEffect(() => {
    if (!pendingLanguage || !realtime.isActive) return;
    realtime.updateSession({
      language: pendingLanguage,
      pagePath: pathname,
      memory: sessionMemory,
    });
    setPendingLanguage(null);
  }, [pendingLanguage, pathname, realtime, sessionMemory]);

  useEffect(() => {
    if (!realtime.isActive || voiceMode !== "realtime") return;
    const timer = window.setTimeout(() => {
      realtime.updateSession({
        pagePath: pathname,
        memory: sessionMemory,
        language: chatLanguage,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pathname, sessionMemory, chatLanguage, realtime, voiceMode]);

  useEffect(() => {
    displayStt.stop();
  }, [displayStt, realtime.isActive, voiceMode]);

  useEffect(() => {
    const onSignupGuide = (event: Event) => {
      const role = (event as CustomEvent<{ role?: "carrier" | "supplier" }>).detail?.role || "carrier";
      const nextMemory: ConciergeVoiceMemory = {
        ...sessionMemory,
        signupStage: "form_filled",
        pendingSignupGuide: true,
        role,
      };
      setSessionMemory(nextMemory);
      saveConciergeMemory(nextMemory);

      if (voiceModeRef.current === "realtime" && realtime.isActive) {
        realtime.updateSession({
          pagePath: pathname,
          memory: nextMemory,
          signupGuide: true,
        });
        realtime.speakGuide(buildSignupGuideHint(role));
        setSessionMemory((prev) => {
          const cleared = { ...prev, pendingSignupGuide: false };
          saveConciergeMemory(cleared);
          return cleared;
        });
      }
    };

    window.addEventListener(CONCIERGE_SIGNUP_GUIDE_EVENT, onSignupGuide);
    return () => window.removeEventListener(CONCIERGE_SIGNUP_GUIDE_EVENT, onSignupGuide);
  }, [pathname, realtime, sessionMemory]);

  useEffect(() => {
    if (!isBudgetRealtimeEnabled()) return;
    const onVis = () => {
      if (document.hidden && voiceModeRef.current === "realtime" && realtime.isActive) {
        realtime.disconnect();
        setRealtimePaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [realtime]);

  useEffect(() => {
    if (voiceMode !== "legacy" || !voiceSessionLive || shouldUseWhisperStt()) return;

    const stt = browserSttRef.current;
    stt.attachHandlers({
      shouldAcceptAudio: () => openRef.current && !sessionBusyRef.current,
      onLiveTranscript: (text) => {
        setCaption((prev) =>
          prev?.role === "user"
            ? { ...prev, text }
            : { text, role: "user", key: ++captionKeyRef.current },
        );
      },
      onBeforeUtterance: (text) => {
        if (isSpeakingRef.current && text.length > 2) stopVoiceRef.current();
      },
      onUtterance: (text) => {
        void handleUserMessageRef.current(text);
      },
      onListeningChange: (listening) => setIsListening(listening),
    });

    void stt.start();

    return () => {
      stt.detach();
    };
  }, [voiceMode, voiceSessionLive, isSpeakingRef]);

  useEffect(() => {
    if (!pathname.startsWith("/onboarding")) return;
    enableConciergeCompanion(pathname);
    setIsCompanion(true);
    setSessionActive(true);
    openRef.current = true;
  }, [pathname]);

  useEffect(() => {
    const onOnboardingContext = (event: Event) => {
      const context = (event as CustomEvent<ConciergeOnboardingContext>).detail;
      if (!context?.stepId) return;

      setSessionMemory((prev) => {
        const next = { ...prev, onboardingContext: context, role: context.role };
        saveConciergeMemory(next);
        return next;
      });

    };

    window.addEventListener(CONCIERGE_ONBOARDING_CONTEXT_EVENT, onOnboardingContext);
    return () => window.removeEventListener(CONCIERGE_ONBOARDING_CONTEXT_EVENT, onOnboardingContext);
  }, [pathname]);

  useEffect(() => {
    const onCelebrate = () => {
      setIsCelebrating(true);
      window.setTimeout(() => setIsCelebrating(false), 2600);
    };
    window.addEventListener(CONCIERGE_CELEBRATE_EVENT, onCelebrate);
    return () => window.removeEventListener(CONCIERGE_CELEBRATE_EVENT, onCelebrate);
  }, []);

  useEffect(() => {
    const onSignupComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ role: "carrier" | "supplier"; fullName?: string; email?: string }>)
        .detail;
      if (!detail?.role) return;
      setIsCelebrating(true);
      window.setTimeout(() => setIsCelebrating(false), 2600);
      setSessionMemory((prev) => {
        const next = {
          ...prev,
          signupStage: "done" as const,
          role: detail.role,
          userName: detail.fullName || prev.userName,
          userEmail: detail.email || prev.userEmail,
        };
        saveConciergeMemory(next);
        return next;
      });
      void syncFromServer().then((merged) => setSessionMemory(merged));
      const msg =
        "Brilliant — account created! Want to share Alpha with a mate? Say share and I'll copy your referral link.";
      setTurnCaption(msg, "assistant", true);
      pushChatMessage("assistant", msg);
      if (voiceModeRef.current === "realtime" && realtimeRef.current?.isActive) {
        realtimeRef.current.speakGuide(`Say warmly: ${msg}`);
      }
    };
    window.addEventListener(CONCIERGE_SIGNUP_COMPLETE_EVENT, onSignupComplete);
    return () => window.removeEventListener(CONCIERGE_SIGNUP_COMPLETE_EVENT, onSignupComplete);
  }, [pushChatMessage, setTurnCaption, syncFromServer]);

  useEffect(() => {
    const onboardingMessage = pathname.startsWith("/onboarding")
      ? buildOnboardingProactiveMessage(sessionMemory.onboardingContext)
      : null;
    const nudge = onboardingMessage
      ? { id: "onboarding-step", message: onboardingMessage, idleMs: 18_000 }
      : getProactiveNudge(pathname);
    if (!nudge) return;

    const nudgeKey = pathname.startsWith("/onboarding")
      ? `${pathname}:${nudge.id}:${sessionMemory.onboardingContext?.stepId ?? "unknown"}`
      : `${pathname}:${nudge.id}`;
    if (proactiveFiredRef.current.has(nudgeKey)) return;

    const timer = window.setTimeout(() => {
      if (Date.now() - lastActivityRef.current < nudge.idleMs - 1500) return;
      if (proactiveFiredRef.current.has(nudgeKey)) return;
      proactiveFiredRef.current.add(nudgeKey);

      if (!isCompanion) return;

      setTurnCaption(nudge.message, "assistant", true);
      pushChatMessage("assistant", nudge.message);
      if (voiceModeRef.current === "realtime" && realtimeRef.current?.isActive) {
        realtimeRef.current.speakGuide(`One soft sentence only: ${nudge.message}`);
      } else if (voiceModeRef.current === "legacy" && openRef.current) {
        speakAsync(speechForConcierge(nudge.message));
      }
    }, nudge.idleMs);

    return () => window.clearTimeout(timer);
  }, [isCompanion, pathname, pushChatMessage, sessionMemory.onboardingContext, setTurnCaption, speakAsync]);

  if (hideWidget) return null;

  const orbUserSpeaking =
    userSpeechActive ||
    isUserTyping ||
    Boolean(liveUserText) ||
    (voiceMode === "legacy" && isListening);

  const orbAiSpeaking = isSpeaking || (isRealtime && realtime.status === "speaking");

  const orbAudioProps = {
    audioActive: isRealtime ? realtime.isActive : voiceSessionLive,
    getMicStream: isRealtime ? realtime.getMicStream : undefined,
    getRemoteAudio: isRealtime ? realtime.getRemoteAudio : undefined,
    userSpeaking: orbUserSpeaking,
    aiSpeaking: orbAiSpeaking,
    emotionTone: userEmotion,
  };

  const statusLabel =
    realtimePaused && isCompanion
      ? "Tap to talk"
      : isUserTyping && liveUserText
        ? "Typing what you say…"
      : userSpeechActive || (isRealtime && realtime.status === "listening")
        ? "I'm listening…"
      : isRealtime && realtime.status === "listening" && !caption
        ? "I'm listening…"
        : orbMode === "listening"
          ? "Listening"
          : orbMode === "speaking"
            ? "Alpha speaking"
            : orbMode === "thinking"
              ? "Connecting…"
              : "Alpha";

  return (
    <>
      <ConciergeCelebration active={isCelebrating} />
      <style jsx global>{`
        @keyframes concierge-type-cursor {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.15;
          }
        }
        .concierge-type-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: concierge-type-cursor 0.85s ease-in-out infinite;
        }
      `}</style>

      <AnimatePresence>
        {!isCompanion && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={orbSpring}
            onClick={openConcierge}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Open Alpha Concierge"
            className="fixed bottom-5 right-4 z-[100] border-0 bg-transparent p-0 shadow-none outline-none sm:bottom-6 sm:right-6"
          >
            <ConciergeVoiceOrb mode="idle" className="h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCompanion && (
          <motion.div
            initial={{ opacity: 0, x: 16, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 12, y: 6 }}
            transition={orbSpring}
            className="fixed bottom-5 right-4 z-[100] flex max-w-[min(88vw,17rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6"
          >
            {(liveAssistantText ||
              turnTexts.assistant ||
              (caption?.role === "assistant" && caption.text && caption.text !== "Connecting to Alpha…")) &&
            realtime.status !== "connecting" ? (
              <p className="rounded-xl bg-slate-900/88 px-3 py-2 text-[12px] leading-snug text-white shadow-lg backdrop-blur-sm">
                {liveAssistantText || turnTexts.assistant || caption?.text}
              </p>
            ) : null}

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-500">
                  {realtime.status === "connecting" ? "Connecting…" : statusLabel}
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => void resumeRealtimeFromCompanion()}
                  aria-label={realtimePaused ? "Talk to Alpha" : "Alpha companion"}
                  className="relative border-0 bg-transparent p-0 outline-none"
                >
                  <ConciergeVoiceOrb mode={orbMode} className="h-12 w-12 sm:h-14 sm:w-14" {...orbAudioProps} />
                </button>
                <button
                  type="button"
                  onClick={closeConcierge}
                  aria-label="Close Alpha companion"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
