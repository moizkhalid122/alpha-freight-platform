"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Mail,
  Minimize2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";

const SUPPORT_EMAIL = "support@alphafreightuk.com";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const quickPrompts = [
  "How do I post a load?",
  "Carrier payouts",
  "Live tracking help",
  "Email human support",
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I'm Alpha Support. Ask about loads, carriers, suppliers, payouts, tracking, or your account. Need a person? Tap Email support below.",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type SupportLiveChatProps = {
  open: boolean;
  onClose: () => void;
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200/80">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-[1.35rem] rounded-tl-md bg-slate-50 px-4 py-3 ring-1 ring-slate-200/80">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-2 w-2 rounded-full bg-slate-400"
              animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SupportLiveChat({ open, onClose }: SupportLiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 280);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (
      trimmed.toLowerCase().includes("human") ||
      trimmed.toLowerCase().includes("email")
    ) {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Alpha Freight Support Request")}&body=${encodeURIComponent("Hi Alpha Freight Support,\n\nI need help with:\n\n")}`;
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: getTimestamp(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const history = nextMessages.slice(-6).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const response = await sendChatMessage(trimmed, {
        assistantType: "general",
        mode: "logistics_copilot",
        history,
      });

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: response.message,
          timestamp: getTimestamp(),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: `I'm having trouble connecting right now. Please email ${SUPPORT_EMAIL} and our team will respond within 2 hours.`,
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close support chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-slate-900/25 backdrop-blur-[6px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 right-4 z-[130] flex h-[min(760px,calc(100vh-2rem))] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18),0_8px_24px_rgba(15,23,42,0.08)]"
          >
            {/* Header */}
            <div className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#BFFF07]/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
                    <Image src="/logo.png" alt="Alpha Freight" width={28} height={28} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                      Alpha Support
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      Online · ~2 min response
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] px-4 py-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-[#9db800]" />
                  Premium support
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                  Instant AI help with human escalation via{" "}
                  <Link
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-[#BFFF07]"
                  >
                    {SUPPORT_EMAIL}
                  </Link>
                </p>
              </div>

              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${
                          isUser
                            ? "bg-slate-900 text-white ring-slate-900/10"
                            : "bg-white text-slate-700 ring-slate-200/80 shadow-sm"
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`max-w-[80%] ${isUser ? "text-right" : "text-left"}`}>
                        <div
                          className={`rounded-[1.35rem] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                            isUser
                              ? "rounded-tr-md bg-slate-900 text-white"
                              : "rounded-tl-md bg-white text-slate-700 ring-1 ring-slate-200/80"
                          }`}
                        >
                          {message.content}
                        </div>
                        <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                          {message.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping ? <TypingIndicator /> : null}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="border-t border-slate-200/80 bg-white p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pl-4 transition focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(191,255,7,0.15)]"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask anything about Alpha Freight..."
                  className="flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-[#BFFF07] hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <Link
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Alpha Freight Support Request")}`}
                className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
              >
                <Mail className="h-3.5 w-3.5" />
                Email human support
              </Link>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export { SUPPORT_EMAIL };
