"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Copy,
  Link2,
  Menu,
  Mic,
  Home,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  Share2,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { getTypingDelay, waitForMinimumDuration } from "@/lib/chat-ui";
import { PUBLIC_AI_MESSAGE_LIMIT } from "@/lib/public-ai-rate-limit";
import { buildWhatsAppShareBody } from "@/lib/public-ai-growth";
import {
  loadRecentChats,
  saveRecentChat,
  deleteRecentChat,
  type StoredChat,
  type StoredChatMessage,
} from "@/lib/public-ai-storage";
import {
  detectThinkingMode,
  getThinkingMessages,
  buildShareUrl,
  type ThinkingMode,
} from "@/lib/public-ai-thinking";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { supabase } from "@/lib/supabase";
import AiThinkingIndicator from "@/components/marketing/AiThinkingIndicator";
import LimitReachedModal from "@/components/marketing/LimitReachedModal";
import CopilotUpgradeBanner from "@/components/marketing/CopilotUpgradeBanner";
import EmailCaptureBar from "@/components/marketing/EmailCaptureBar";
import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

interface PublicFreightAiAppProps {
  embedded?: boolean;
  initialPrompt?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredMessage?: StructuredAssistantReply;
}

const SUGGESTED_PROMPTS = [
  "What is RPM in haulage?",
  "UK diesel price today",
  "How do I find loads?",
  "Calculate profit £800 for 320 miles",
];

const SIDEBAR_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Find Loads UK", href: "/find-loads", icon: Truck },
  { label: "Post Loads", href: "/post-loads" },
  { label: "Freight Tools", href: "/tools" },
  { label: "Knowledge Base", href: "/knowledge-base" },
];

function buildDisplayText(reply?: StructuredAssistantReply, fallback = ""): string {
  if (!reply) return fallback;
  return [
    reply.title,
    reply.shortExplanation,
    ...(reply.keyPoints || []),
    reply.recommendation ? `💡 ${reply.recommendation}` : "",
    reply.nextStep ? `→ ${reply.nextStep}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function toStoredMessages(messages: Message[]): StoredChatMessage[] {
  return messages.map(({ id, role, content }) => ({ id, role, content }));
}

function fromStoredMessages(stored: StoredChatMessage[]): Message[] {
  return stored.map((m) => ({ ...m }));
}

function AssistantReply({ reply, content, isStreaming }: { reply?: StructuredAssistantReply; content: string; isStreaming?: boolean }) {
  if (isStreaming || !reply) {
    return <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-[#0d0d0d]">{content}</p>;
  }

  return (
    <div className="space-y-3 text-[15px] leading-[1.75] text-[#0d0d0d]">
      {reply.title ? <p className="font-semibold text-[#0d0d0d]">{reply.title}</p> : null}
      {reply.shortExplanation ? <p>{reply.shortExplanation}</p> : null}
      {reply.keyPoints && reply.keyPoints.length > 0 ? (
        <ul className="space-y-2 pl-1">
          {reply.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {reply.recommendation ? (
        <p className="rounded-xl bg-[#f4f4f4] px-4 py-3 text-sm text-[#444]">{reply.recommendation}</p>
      ) : null}
      {reply.nextStep ? <p className="text-sm text-[#666]">{reply.nextStep}</p> : null}
      {reply.quickActions && reply.quickActions.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {reply.quickActions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#0d0d0d] transition hover:bg-[#f7f7f8]"
              >
                {action.label}
              </Link>
            ) : null
          )}
        </div>
      ) : null}
      {!reply.shortExplanation && !reply.keyPoints?.length && content ? (
        <p className="whitespace-pre-wrap">{content}</p>
      ) : null}
    </div>
  );
}

export default function PublicFreightAiApp({ embedded = false, initialPrompt }: PublicFreightAiAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [remaining, setRemaining] = useState(PUBLIC_AI_MESSAGE_LIMIT);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [recentChats, setRecentChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [thinkingMessage, setThinkingMessage] = useState("Alpha Freight AI is thinking…");
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>("thinking");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialQueryHandled = useRef(false);
  const thinkingIndexRef = useRef(0);

  const hasConversation = messages.some((m) => m.role === "user");
  const firstUserQuery = messages.find((m) => m.role === "user")?.content || "";

  const { isListening, supported: voiceSupported, toggle: toggleVoice } = useVoiceInput(
    useCallback((text: string) => {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
      textareaRef.current?.focus();
    }, [])
  );

  useEffect(() => {
    setRecentChats(loadRecentChats());
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role) setUserRole(String(data.role));
    });
  }, []);

  useEffect(() => {
    if (initialQueryHandled.current) return;
    const fromProp = initialPrompt?.trim();
    const fromUrl = new URLSearchParams(window.location.search).get("q")?.trim();
    const q = fromProp || fromUrl;
    if (!q) return;
    initialQueryHandled.current = true;
    window.setTimeout(() => void handleSend(q), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, thinkingMessage]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    if (!isTyping) return;
    const messages_list = getThinkingMessages(thinkingMode);
    const intervalId = window.setInterval(() => {
      thinkingIndexRef.current = (thinkingIndexRef.current + 1) % messages_list.length;
      setThinkingMessage(messages_list[thinkingIndexRef.current]);
    }, 2200);
    return () => window.clearInterval(intervalId);
  }, [isTyping, thinkingMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewChat();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateShareUrl = (query: string) => {
    const url = buildShareUrl(query);
    window.history.replaceState({}, "", url);
  };

  const persistChat = (chatId: string, chatMessages: Message[]) => {
    const firstUser = chatMessages.find((m) => m.role === "user")?.content || "New chat";
    const stored: StoredChat = {
      id: chatId,
      title: firstUser.slice(0, 56),
      messages: toStoredMessages(chatMessages),
      updatedAt: Date.now(),
    };
    setRecentChats(saveRecentChat(stored));
  };

  const buildHistory = (items: Message[]): ChatHistoryItem[] =>
    items.slice(-8).map((item) => ({
      role: item.role,
      content: item.content || buildDisplayText(item.structuredMessage),
    }));

  const typeMessage = async (fullText: string, messageId: string) => {
    const words = fullText.split(/\s+/).filter(Boolean);
    let currentText = "";
    setStreamingMessageId(messageId);

    const batchSize = words.length > 100 ? 2 : 1;

    for (let i = 0; i < words.length; i += batchSize) {
      const chunk = words.slice(i, i + batchSize).join(" ");
      currentText += (currentText ? " " : "") + chunk;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, content: currentText } : msg))
      );
      const delay = batchSize > 1 ? 5 : getTypingDelay(words[i]);
      await new Promise((r) => setTimeout(r, delay));
    }

    setStreamingMessageId(null);
  };

  const streamAssistantReply = async (
    fullText: string,
    messageId: string,
    structuredMessage?: StructuredAssistantReply
  ) => {
    const displayText = buildDisplayText(structuredMessage, fullText);
    await typeMessage(displayText, messageId);
    if (structuredMessage) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, structuredMessage } : message
        )
      );
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setActiveChatId(null);
    setMobileSidebar(false);
    window.history.replaceState({}, "", "/ai");
    textareaRef.current?.focus();
  };

  const loadChat = (chat: StoredChat) => {
    setMessages(fromStoredMessages(chat.messages));
    setActiveChatId(chat.id);
    setMobileSidebar(false);
    const firstQ = chat.messages.find((m) => m.role === "user")?.content;
    if (firstQ) updateShareUrl(firstQ);
  };

  const handleSend = async (text: string = input, e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) return;

    const chatId = activeChatId || Date.now().toString();
    if (!activeChatId) setActiveChatId(chatId);

    updateShareUrl(trimmedText);

    const mode = detectThinkingMode(trimmedText);
    setThinkingMode(mode);
    thinkingIndexRef.current = 0;
    setThinkingMessage(getThinkingMessages(mode)[0]);

    const thinkingStartedAt = Date.now();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const aiResponse = await sendChatMessage(trimmedText, {
        assistantType: "general",
        history: buildHistory(nextMessages),
        publicMode: true,
      });

      if (aiResponse.limitReached) {
        setIsTyping(false);
        setRemaining(0);
        setShowLimitModal(true);
        return;
      }

      if (typeof aiResponse.remaining === "number") {
        setRemaining(aiResponse.remaining);
      }

      await waitForMinimumDuration(thinkingStartedAt, 60);

      const aiMessageId = `${Date.now()}-assistant`;
      setIsTyping(false);

      const withAssistant = [
        ...nextMessages,
        { id: aiMessageId, role: "assistant" as const, content: "" },
      ];
      setMessages(withAssistant);

      await streamAssistantReply(aiResponse.message, aiMessageId, aiResponse.structuredMessage);

      setMessages((current) => {
        persistChat(chatId, current);
        return current;
      });
    } catch {
      setIsTyping(false);
      setStreamingMessageId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
  };

  const getMessageText = (messageId: string) => {
    const target = messages.find((m) => m.id === messageId);
    return target?.content || buildDisplayText(target?.structuredMessage);
  };

  const handleCopy = async (messageId: string) => {
    const text = getMessageText(messageId);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleCopyShareLink = async (messageId: string) => {
    const query = firstUserQuery || getMessageText(messageId).slice(0, 120);
    const url = buildShareUrl(query);
    try {
      await navigator.clipboard.writeText(url);
      setSharedId(messageId);
      window.setTimeout(() => setSharedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleWhatsAppShare = (messageId: string) => {
    const text = getMessageText(messageId);
    const url = buildShareUrl(firstUserQuery || text.slice(0, 80));
    const body = buildWhatsAppShareBody(text, url);
    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-3 py-4">
        <Link href="/" className="relative h-8 w-8 shrink-0 transition hover:opacity-80" title="Home">
          <Image src="/logo.png" alt="Alpha Freight — Home" fill className="object-contain" />
        </Link>
        {sidebarOpen && (
          <Link href="/" className="text-sm font-semibold text-[#0d0d0d] transition hover:text-[#666]">
            Alpha Freight AI
          </Link>
        )}
      </div>

      <div className="space-y-1 px-2">
        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#0d0d0d] transition hover:bg-[#ececec]"
        >
          <SquarePen className="h-4 w-4 shrink-0" />
          {sidebarOpen && (
            <span className="flex-1 text-left">
              New chat{" "}
              <span className="text-[10px] text-[#999]">Ctrl+K</span>
            </span>
          )}
        </button>
      </div>

      {sidebarOpen && recentChats.length > 0 && (
        <div className="mt-4 flex-1 overflow-hidden px-2">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-[#999]">
            Recent chats
          </p>
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto">
            {recentChats.map((chat) => (
              <div key={chat.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadChat(chat)}
                  className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#ececec] ${
                    activeChatId === chat.id ? "bg-[#ececec] font-medium text-[#0d0d0d]" : "text-[#666]"
                  }`}
                >
                  <span className="block truncate">{chat.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecentChats(deleteRecentChat(chat.id))}
                  className="rounded p-1.5 text-[#ccc] opacity-0 transition hover:bg-[#ececec] hover:text-[#666] group-hover:opacity-100"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sidebarOpen && (
        <>
          <div className="mt-4 px-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#999]">AI guides</p>
          </div>
          <nav className="space-y-0.5 px-2">
            {[
              { label: "RPM calculator", href: "/ai/rpm-calculator" },
              { label: "UK diesel price", href: "/ai/diesel-price-uk" },
              { label: "Find loads", href: "/ai/find-loads" },
              { label: "Post loads", href: "/ai/post-load" },
              { label: "POD guide", href: "/ai/pod-guide" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-1.5 text-xs text-[#666] transition hover:bg-[#ececec] hover:text-[#0d0d0d]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 px-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#999]">Explore</p>
          </div>
          <nav className="space-y-0.5 px-2">
            {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#444] transition hover:bg-[#ececec] hover:text-[#0d0d0d]"
              >
                {Icon ? (
                  <Icon className="h-4 w-4 shrink-0 opacity-60" />
                ) : (
                  <Truck className="h-4 w-4 shrink-0 opacity-40" />
                )}
                {label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto border-t border-[#e5e5e5] p-3">
        {sidebarOpen ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-[#ececec]/60 px-3 py-2.5">
              <p className="text-xs font-medium text-[#666]">Free guest</p>
              <p className="text-sm font-semibold text-[#0d0d0d]">
                {remaining} / {PUBLIC_AI_MESSAGE_LIMIT} msgs · hr
              </p>
            </div>
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm font-medium text-[#444] transition hover:bg-[#f7f7f8]"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/auth/select"
              className="flex w-full items-center justify-center rounded-xl bg-[#0d0d0d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
            >
              Find live loads — sign up free
            </Link>
            <EmailCaptureBar />
          </div>
        ) : null}
      </div>
    </div>
  );

  const inputBox = (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={(e) => void handleSend(input, e)}
        className="relative flex items-end gap-2 rounded-[28px] border border-[#e5e5e5] bg-white px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition focus-within:border-[#d0d0d0] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <button
          type="button"
          className="mb-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f4f4f4]"
          aria-label="Attach"
        >
          <Plus className="h-5 w-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(input);
            }
          }}
          placeholder="Ask anything..."
          disabled={isTyping}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-3 text-[15px] text-[#0d0d0d] placeholder:text-[#999] focus:outline-none disabled:opacity-60"
        />

        <div className="mb-1.5 flex shrink-0 items-center gap-1">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isTyping}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isListening ? "bg-red-50 text-red-600" : "text-[#666] hover:bg-[#f4f4f4]"
              }`}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              input.trim() ? "bg-[#0d0d0d] text-white hover:bg-[#333]" : "bg-[#f4f4f4] text-[#bbb]"
            } disabled:opacity-50`}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2L4 12h6v10l8-12h-6V2z" />
            </svg>
          </button>
        </div>
      </form>
      <p className="mt-3 text-center text-xs text-[#999]">
        Alpha Freight AI · Enter to send · Shift+Enter new line · Ctrl+K new chat
      </p>
    </div>
  );

  return (
    <div
      className={`flex overflow-hidden bg-white text-[#0d0d0d] ${
        embedded ? "h-full min-h-0" : "h-[100dvh]"
      }`}
    >
      <LimitReachedModal open={showLimitModal} onClose={() => setShowLimitModal(false)} />
      <aside
        className={`hidden shrink-0 flex-col border-r border-[#e5e5e5] bg-[#f9f9f9] transition-all duration-200 md:flex ${
          sidebarOpen ? "w-[260px]" : "w-[52px]"
        }`}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[#e5e5e5] bg-[#f9f9f9] md:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileSidebar(false)}
                className="absolute right-3 top-3 rounded-lg p-2 text-[#666] hover:bg-[#ececec]"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {userRole && (userRole === "carrier" || userRole === "supplier") && (
          <CopilotUpgradeBanner role={userRole} />
        )}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#ececec] px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="rounded-lg p-2 text-[#666] hover:bg-[#f4f4f4] md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden rounded-lg p-2 text-[#666] hover:bg-[#f4f4f4] md:flex"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#0d0d0d] transition hover:bg-[#f4f4f4]"
            >
              <Home className="h-4 w-4 text-[#666]" />
              Home
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/find-loads"
              className="hidden rounded-full border border-[#e5e5e5] px-4 py-1.5 text-sm font-medium text-[#444] transition hover:bg-[#f7f7f8] sm:inline-flex"
            >
              Find loads
            </Link>
            <Link
              href="/auth/select"
              className="rounded-full bg-[#0d0d0d] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#333]"
            >
              Sign up free
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {!hasConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
              <div className="mb-6 flex items-center justify-center">
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-[#ececec] shadow-sm">
                  <Image src="/logo.png" alt="Alpha Freight AI" width={40} height={40} className="object-contain p-1.5" />
                </div>
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center text-[28px] font-normal tracking-tight text-[#0d0d0d] sm:text-[32px]"
              >
                Where should we begin?
              </motion.h1>
              <div className="w-full max-w-3xl">{inputBox}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-2 px-4">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={isTyping}
                    className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm text-[#444] transition hover:bg-[#f7f7f8] disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] rounded-[24px] bg-[#f4f4f4] px-5 py-3 text-[15px] leading-relaxed text-[#0d0d0d]">
                            {message.content}
                          </div>
                        </div>
                      ) : (
                        <div className="group flex gap-4">
                          <div className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#f4f4f4] ring-1 ring-[#ececec]">
                            <Image src="/logo.png" alt="" fill className="object-contain p-1" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <AssistantReply
                              reply={message.structuredMessage}
                              content={message.content}
                              isStreaming={streamingMessageId === message.id}
                            />

                            {message.content && streamingMessageId !== message.id && (
                              <div className="mt-3 flex flex-wrap items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() => void handleCopy(message.id)}
                                  className="rounded-lg p-1.5 text-[#999] hover:bg-[#f4f4f4] hover:text-[#666]"
                                  title={copiedId === message.id ? "Copied!" : "Copy answer"}
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWhatsAppShare(message.id)}
                                  className="rounded-lg p-1.5 text-[#999] hover:bg-[#f4f4f4] hover:text-[#25D366]"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleCopyShareLink(message.id)}
                                  className="rounded-lg p-1.5 text-[#999] hover:bg-[#f4f4f4] hover:text-[#666]"
                                  title={sharedId === message.id ? "Link copied!" : "Copy share link"}
                                >
                                  <Link2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFeedback((f) => ({
                                      ...f,
                                      [message.id]: f[message.id] === "up" ? null : "up",
                                    }))
                                  }
                                  className={`rounded-lg p-1.5 hover:bg-[#f4f4f4] ${
                                    feedback[message.id] === "up" ? "text-[#0d0d0d]" : "text-[#999]"
                                  }`}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFeedback((f) => ({
                                      ...f,
                                      [message.id]: f[message.id] === "down" ? null : "down",
                                    }))
                                  }
                                  className={`rounded-lg p-1.5 hover:bg-[#f4f4f4] ${
                                    feedback[message.id] === "down" ? "text-[#0d0d0d]" : "text-[#999]"
                                  }`}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            {message.structuredMessage?.suggestedQuestions?.map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => void handleSend(q.replace(/^[^\w]+/, "").trim() || q)}
                                className="mt-2 mr-2 inline-block rounded-full border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#666] hover:bg-[#f7f7f8]"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <AiThinkingIndicator message={thinkingMessage} mode={thinkingMode} />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="shrink-0 border-t border-[#ececec] bg-white px-4 py-4">
                {inputBox}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
