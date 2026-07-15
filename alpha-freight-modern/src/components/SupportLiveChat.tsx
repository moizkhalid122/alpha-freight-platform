"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Loader2,
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
  "How do carrier payouts work?",
  "Help with live tracking",
  "Talk to human support",
];

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to Alpha Freight Support. I'm your AI assistant — ask about loads, carriers, suppliers, payouts, tracking, or account help. For urgent cases, use Email Support anytime.",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

function getTimestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type SupportLiveChatProps = {
  open: boolean;
  onClose: () => void;
};

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
    const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (trimmed.toLowerCase().includes("human") || trimmed.toLowerCase().includes("email")) {
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
          content: `I'm having trouble connecting right now. Please email us at ${SUPPORT_EMAIL} and our team will respond within 2 hours.`,
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
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 right-4 z-[130] flex h-[min(760px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,#111_0%,#0b0b0b_100%)] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#BFFF07]">
                    <Image src="/logo.png" alt="Alpha Freight" width={28} height={28} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b0b0b] bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                      Alpha Support
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Online · avg 2 min response
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              <div className="rounded-2xl border border-[#BFFF07]/20 bg-[#BFFF07]/10 px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#BFFF07]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Support
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  AI-powered instant help plus human escalation via{" "}
                  <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-[#BFFF07] hover:underline">
                    {SUPPORT_EMAIL}
                  </Link>
                </p>
              </div>

              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        isUser ? "bg-white text-black" : "bg-[#BFFF07] text-black"
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[78%] ${isUser ? "text-right" : "text-left"}`}>
                      <div
                        className={`rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "rounded-tr-md bg-white text-black"
                            : "rounded-tl-md border border-white/10 bg-white/[0.04] text-white/85"
                        }`}
                      >
                        {message.content}
                      </div>
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isTyping ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#BFFF07] text-black">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-[1.25rem] rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Alpha Support is typing...
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={endRef} />
            </div>

            <div className="border-t border-white/10 bg-[#111] p-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:border-[#BFFF07]/40 hover:bg-[#BFFF07]/10 hover:text-[#BFFF07]"
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
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your support question..."
                  className="flex-1 rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#BFFF07]/50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#BFFF07] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <Link
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Alpha Freight Support Request")}`}
                className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 transition hover:text-[#BFFF07]"
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
