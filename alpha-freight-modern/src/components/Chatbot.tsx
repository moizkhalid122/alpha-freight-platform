"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MapPin, Package, RotateCcw, Send, SquarePen, Truck, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { sendChatMessage } from "@/lib/api";
import {
  getChatLanguagePreference,
  SITE_LOCALE_CHANGE_EVENT,
} from "@/lib/site-language-preference";
import type { LanguagePreference } from "@/lib/copilot/language";
import { useSiteT } from "@/components/SiteLanguageProvider";
import { getThinkingStates, getTypingDelay, waitForMinimumDuration, shouldShowInstantReply } from "@/lib/chat-ui";
import ThinkingStateCard from "@/components/chat/ThinkingStateCard";
import type { ChatHistoryItem, CopilotMode, StructuredAssistantReply } from "@/lib/chat-types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredMessage?: StructuredAssistantReply;
}

const FEATURED_PROMPT = {
  titleKey: "chat.featuredTitle",
  subtitleKey: "chat.featuredSubtitle",
  prompt: "Find loads near me",
};

const EXPLORE_PROMPTS: Array<{ labelKey: string; prompt: string; icon: LucideIcon }> = [
  { labelKey: "chat.trackShipment", prompt: "Explain shipment tracking", icon: Package },
  { labelKey: "chat.postLoad", prompt: "How do I post a load on Alpha Freight?", icon: Truck },
  { labelKey: "chat.freightQuote", prompt: "Get a freight quote for my route", icon: MapPin },
];

const panelSpring = { type: "spring" as const, stiffness: 360, damping: 30, mass: 0.85 };
const easeOut = [0.22, 1, 0.36, 1] as const;
const messageMotion = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.28, ease: easeOut },
};

function ChatWelcome({ onSelect }: { onSelect: (prompt: string) => void }) {
  const t = useSiteT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="flex min-h-full flex-col justify-center px-1 py-2"
    >
      <div className="text-center">
        <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
          {t("chat.welcomeTitle")}
        </h3>
        <p className="mx-auto mt-2 max-w-[280px] text-[12.5px] leading-relaxed text-slate-500">
          {t("chat.welcomeSubtitle")}
        </p>
      </div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.06, ease: easeOut }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onSelect(FEATURED_PROMPT.prompt)}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-3.5 py-3 text-left transition-colors hover:border-orange-200 hover:bg-orange-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-orange-100">
          <div className="relative h-6 w-6">
            <Image src="/logo.png" alt="" fill className="object-contain" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-slate-900">{t(FEATURED_PROMPT.titleKey)}</p>
          <p className="text-[11px] text-slate-500">{t(FEATURED_PROMPT.subtitleKey)}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </motion.button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <span className="text-[11px] text-slate-400">{t("chat.explore")}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {EXPLORE_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.labelKey}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05, ease: easeOut }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(item.prompt)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-2 py-3.5 transition-colors hover:border-orange-200 hover:bg-orange-50/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100/80">
                <Icon className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-center text-[11px] font-medium leading-tight text-slate-700">
                {t(item.labelKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function PremiumOrangeLine() {
  return (
    <div
      aria-hidden
      className="h-px w-full shrink-0"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(251,146,60,0.15) 12%, rgba(249,115,22,0.45) 50%, rgba(251,146,60,0.15) 88%, transparent 100%)",
      }}
    />
  );
}

export default function Chatbot() {
  const t = useSiteT();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<LanguagePreference>("english");
  const selectedMode: CopilotMode = "logistics_copilot";
  const thinkingStates = getThinkingStates("general");

  const hideWidget =
    pathname.startsWith("/carrier") ||
    pathname.startsWith("/supplier") ||
    pathname.startsWith("/ops-af-7x9k2") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/directors-agreement") ||
    pathname.startsWith("/executive-agreement") ||
    pathname.startsWith("/master-plan") ||
    pathname.startsWith("/revenue-model") ||
    pathname === "/ai" ||
    pathname.startsWith("/ai/");

  useEffect(() => {
    setChatLanguage(getChatLanguagePreference());
    const onLocaleChange = () => setChatLanguage(getChatLanguagePreference());
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange);
  }, []);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isTyping) {
      setThinkingStep(0);
      return;
    }
    const intervalId = window.setInterval(() => {
      setThinkingStep((current) => (current + 1) % thinkingStates.length);
    }, 1400);
    return () => window.clearInterval(intervalId);
  }, [isTyping, thinkingStates.length]);

  const buildHistory = (items: Message[]): ChatHistoryItem[] =>
    items.slice(-6).map((item) => ({ role: item.role, content: item.content }));

  const resetChat = () => {
    if (isTyping) return;
    setMessages([]);
    setInput("");
    setStreamingMessageId(null);
    setShowNewChatConfirm(false);
  };

  const isWelcomeState = messages.length === 0 && !isTyping;

  const openNewChatConfirm = () => {
    if (isTyping) return;
    if (messages.length === 0) return;
    setShowNewChatConfirm(true);
  };

  const typeMessage = async (fullText: string, messageId: string) => {
    let currentText = "";
    const words = fullText.split(" ");
    setStreamingMessageId(messageId);

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: currentText } : msg)),
      );
      await new Promise((resolve) => setTimeout(resolve, getTypingDelay(words[i])));
    }

    setStreamingMessageId(null);
  };

  const streamAssistantReply = async (
    fullText: string,
    messageId: string,
    structuredMessage?: StructuredAssistantReply,
  ) => {
    if (shouldShowInstantReply(structuredMessage)) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, content: fullText, structuredMessage }
            : message,
        ),
      );
      return;
    }

    await typeMessage(fullText, messageId);
    if (!structuredMessage) return;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, structuredMessage } : message,
      ),
    );
  };

  const handleSend = async (text: string = input, e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) return;
    const thinkingStartedAt = Date.now();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await sendChatMessage(trimmedText, {
        assistantType: "general",
        mode: selectedMode,
        history: buildHistory(nextMessages),
        language: chatLanguage,
      });
      await waitForMinimumDuration(
        thinkingStartedAt,
        shouldShowInstantReply(aiResponse.structuredMessage) ? 0 : 120,
      );
      const aiMessageId = (Date.now() + 1).toString();
      setIsTyping(false);

      setMessages((prev) => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);
      await streamAssistantReply(aiResponse.message, aiMessageId, aiResponse.structuredMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setIsTyping(false);
      setStreamingMessageId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: t("chat.error"),
        },
      ]);
    }
  };

  if (hideWidget) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={panelSpring}
            className="fixed bottom-5 right-4 z-[90] sm:bottom-6 sm:right-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/80"
              aria-label="Open Alpha Freight AI"
            >
              <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              role="button"
              tabIndex={-1}
              aria-label="Close chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[99] bg-slate-900/15 backdrop-blur-[2px] md:bg-slate-900/8"
            />

            <motion.div
              role="dialog"
              aria-label="Alpha Freight AI"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={panelSpring}
              className="fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden bg-white md:inset-auto md:bottom-5 md:right-5 md:h-[min(760px,calc(100vh-2.5rem))] md:w-[min(460px,calc(100vw-2rem))] md:rounded-[22px] md:border md:border-slate-200/60 md:shadow-[0_20px_70px_rgba(15,23,42,0.16)]"
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Compact header */}
              <div className="flex h-[52px] shrink-0 items-center justify-between px-4 md:rounded-t-[22px]">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative h-7 w-7 shrink-0">
                    <Image src="/logo.png" alt="" fill className="object-contain" />
                  </div>
                  <p className="truncate text-[14px] font-semibold text-slate-900">{t("chat.title")}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={openNewChatConfirm}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600"
                    aria-label="New chat"
                  >
                    <SquarePen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                    aria-label="Minimize chat"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <PremiumOrangeLine />

              {/* Messages */}
              <div
                ref={messagesScrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4 [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70 [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {isWelcomeState ? (
                  <ChatWelcome onSelect={(prompt) => handleSend(prompt)} />
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        {...messageMotion}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "user" ? (
                          <div className="max-w-[78%] rounded-[16px] rounded-br-[5px] bg-slate-900 px-3 py-1.5 text-[12.5px] leading-[1.5] text-white">
                            <p className="whitespace-pre-line">{message.content}</p>
                          </div>
                        ) : (
                          <div className="max-w-[88%] px-0.5 py-0.5 text-[12.5px] leading-[1.65] text-slate-600">
                            <p className="whitespace-pre-line">
                              {message.content}
                              {streamingMessageId === message.id ? (
                                <motion.span
                                  animate={{ opacity: [1, 0.2, 1] }}
                                  transition={{ duration: 0.9, repeat: Infinity }}
                                  className="ml-0.5 inline-block h-[12px] w-[2px] translate-y-[1px] bg-slate-400"
                                />
                              ) : null}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div {...messageMotion} className="flex justify-start px-0.5">
                        <ThinkingStateCard states={thinkingStates} activeIndex={thinkingStep} />
                      </motion.div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <PremiumOrangeLine />
              <form
                onSubmit={(e) => handleSend(input, e)}
                className="shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:rounded-b-[22px]"
              >
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition-colors focus-within:border-slate-300 focus-within:bg-white">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    placeholder={t("chat.placeholder")}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
                  />
                  <motion.button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white disabled:bg-slate-300"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </form>

              {/* New chat confirmation */}
              <AnimatePresence>
                {showNewChatConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 px-5 backdrop-blur-[3px] md:rounded-[22px]"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={panelSpring}
                      className="w-full max-w-[320px] rounded-[22px] border border-slate-200/80 bg-white px-6 py-6 text-center shadow-[0_16px_50px_rgba(15,23,42,0.12)]"
                      role="dialog"
                      aria-labelledby="new-chat-title"
                    >
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
                        <RotateCcw className="h-5 w-5 text-orange-500" />
                      </div>
                      <h4 id="new-chat-title" className="text-[17px] font-semibold text-slate-900">
                        {t("chat.newChatTitle")}
                      </h4>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                        {t("chat.newChatBody")}
                      </p>
                      <div className="mt-5 flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowNewChatConfirm(false)}
                          className="flex-1 rounded-full border border-slate-300 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                        >
                          {t("chat.keepChatting")}
                        </button>
                        <button
                          type="button"
                          onClick={resetChat}
                          className="flex-1 rounded-full bg-slate-900 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                          {t("chat.startNew")}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
