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
  Search,
  Share2,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Truck,
  X,
  ArrowRight,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import { streamPublicChatMessage } from "@/lib/api";
import { buildPublicInstantSocialReply } from "@/lib/public-ai-instant-replies";
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
  buildShareUrl,
} from "@/lib/public-ai-thinking";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { supabase } from "@/lib/supabase";
import AiThinkingIndicator from "@/components/marketing/AiThinkingIndicator";
import NavbarAiLottie from "@/components/NavbarAiLottie";
import LimitReachedModal from "@/components/marketing/LimitReachedModal";
import CopilotUpgradeBanner from "@/components/marketing/CopilotUpgradeBanner";
import EmailCaptureBar from "@/components/marketing/EmailCaptureBar";
import AiRichMarkdown from "@/components/marketing/AiRichMarkdown";
import AiPageBackground from "@/components/marketing/ai/AiPageBackground";
import AiInputSuggestions from "@/components/marketing/ai/AiInputSuggestions";
import AiAttachMenu, { AiImagePreview } from "@/components/marketing/ai/AiAttachMenu";
import AiConfidenceFooter from "@/components/marketing/ai/AiConfidenceFooter";
import {
  CHAT_IMAGE_ACCEPT,
  DEFAULT_CHAT_IMAGE_PROMPT,
  readChatImageFile,
} from "@/lib/chat-image-upload";
import PublicAiMessageExtras from "@/components/marketing/ai/PublicAiMessageExtras";
import { prependPersonality, getPersonalityPrefix } from "@/lib/ai-personality";
import { playAiCompleteSound } from "@/lib/ai-complete-sound";
import { matchInputSuggestions } from "@/lib/ai-input-suggestions";
import {
  extractMemoryFromText,
  loadPublicAiMemory,
  mergeMemoryFromHistory,
  savePublicAiMemory,
  type PublicAiSessionMemory,
} from "@/lib/public-ai-memory";
import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

interface PublicFreightAiAppProps {
  embedded?: boolean;
  initialPrompt?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  structuredMessage?: StructuredAssistantReply;
  meta?: {
    responseTimeMs?: number;
    userQuery?: string;
  };
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
  if (reply.displayStyle === "plain") {
    return reply.rawText || reply.shortExplanation || fallback;
  }
  return [
    reply.title,
    reply.shortExplanation,
    ...(reply.keyPoints || []),
    reply.recommendation ? reply.recommendation : "",
    reply.nextStep ? reply.nextStep : "",
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

function QuickActionLinks({ actions }: { actions: NonNullable<StructuredAssistantReply["quickActions"]> }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {actions.map((action) =>
        action.href ? (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#0d0d0d] transition hover:bg-[#f7f7f8]"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 text-[#7a9900]" />
          </Link>
        ) : null
      )}
    </div>
  );
}

function AssistantReply({ reply, content, isStreaming }: { reply?: StructuredAssistantReply; content: string; isStreaming?: boolean }) {
  const markdown = (reply?.rawText || reply?.shortExplanation || content).trim();

  if (isStreaming || !reply || reply.displayStyle === "plain") {
    return (
      <div className="space-y-3 text-[15px] leading-[1.75] text-[#0d0d0d]">
        <AiRichMarkdown content={markdown} isStreaming={isStreaming} />
        {!isStreaming && reply?.quickActions && reply.quickActions.length > 0 ? (
          <QuickActionLinks actions={reply.quickActions} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[15px] leading-[1.75] text-[#0d0d0d]">
      {reply.title ? <p className="font-semibold text-[#0d0d0d]">{reply.title}</p> : null}
      {reply.shortExplanation ? <AiRichMarkdown content={reply.shortExplanation} /> : null}
      {reply.keyPoints && reply.keyPoints.length > 0 ? (
        <ul className="space-y-2 pl-1">
          {reply.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFFF07]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {reply.recommendation ? (
        <div className="flex gap-2.5 rounded-xl border border-[#BFFF07]/40 bg-[#f7ffe8] px-4 py-3 text-sm text-[#3d4d00]">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#7a9900]" />
          <span>{reply.recommendation}</span>
        </div>
      ) : null}
      {reply.nextStep ? <p className="text-sm text-[#666]">{reply.nextStep}</p> : null}
      {reply.quickActions && reply.quickActions.length > 0 ? (
        <QuickActionLinks actions={reply.quickActions} />
      ) : null}
      {!reply.shortExplanation && !reply.keyPoints?.length && content ? (
        <AiRichMarkdown content={content} />
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
  const [pendingQuery, setPendingQuery] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [sessionMemory, setSessionMemory] = useState<PublicAiSessionMemory>(() => loadPublicAiMemory());
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const initialQueryHandled = useRef(false);

  const hasConversation = messages.some((m) => m.role === "user");
  const inputSuggestions = matchInputSuggestions(input);
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
  }, [messages, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

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
    items.slice(-14).map((item) => ({
      role: item.role,
      content: (item.content || buildDisplayText(item.structuredMessage)).slice(0, 1400),
    }));

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setPendingImageUrl(null);
    setImageError(null);
    setActiveChatId(null);
    setMobileSidebar(false);
    setSessionMemory({});
    savePublicAiMemory({});
    window.history.replaceState({}, "", "/ai");
    textareaRef.current?.focus();
  };

  const loadChat = (chat: StoredChat) => {
    const loaded = fromStoredMessages(chat.messages);
    setMessages(loaded);
    setActiveChatId(chat.id);
    setMobileSidebar(false);
    const mem = mergeMemoryFromHistory(
      loaded.map((m) => ({ role: m.role, content: m.content })),
      {}
    );
    setSessionMemory(mem);
    savePublicAiMemory(mem);
    const firstQ = chat.messages.find((m) => m.role === "user")?.content;
    if (firstQ) updateShareUrl(firstQ);
  };

  const handleImageSelected = async (file: File | null) => {
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await readChatImageFile(file);
      setPendingImageUrl(dataUrl);
      textareaRef.current?.focus();
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not upload image.");
    }
  };

  const handleSend = async (
    text: string = input,
    e?: React.FormEvent,
    options?: { imageDataUrl?: string | null }
  ) => {
    e?.preventDefault();
    const trimmedText = text.trim();
    const imageDataUrl = options?.imageDataUrl ?? pendingImageUrl;
    if ((!trimmedText && !imageDataUrl) || isTyping) return;

    const effectiveText = trimmedText || DEFAULT_CHAT_IMAGE_PROMPT;
    const displayText = trimmedText || "📷 Image uploaded";

    const chatId = activeChatId || Date.now().toString();
    if (!activeChatId) setActiveChatId(chatId);

    updateShareUrl(effectiveText);

    const priorHistory = buildHistory(messages);
    const instantSocial = imageDataUrl
      ? null
      : buildPublicInstantSocialReply(effectiveText, priorHistory);

    const nextMemory = extractMemoryFromText(effectiveText, sessionMemory);
    setSessionMemory(nextMemory);
    savePublicAiMemory(nextMemory);

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: displayText,
      imageUrl: imageDataUrl || undefined,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPendingImageUrl(null);
    setImageError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (instantSocial) {
      const aiMessageId = `${Date.now()}-assistant`;
      const body = prependPersonality(
        buildDisplayText(instantSocial.structuredMessage, instantSocial.message),
        effectiveText
      );
      const withAssistant = [
        ...nextMessages,
        {
          id: aiMessageId,
          role: "assistant" as const,
          content: body,
          structuredMessage: { ...instantSocial.structuredMessage, rawText: body, shortExplanation: body },
          meta: { userQuery: effectiveText, responseTimeMs: 120 },
        },
      ];
      setMessages(withAssistant);
      playAiCompleteSound();
      setMessages((current) => {
        persistChat(chatId, current);
        return current;
      });
      return;
    }

    setPendingQuery(effectiveText);
    const aiMessageId = `${Date.now()}-assistant`;
    const requestStartedAt = Date.now();
    setIsTyping(true);
    setStreamingMessageId(null);

    let streamStarted = false;
    const personalityPrefix = getPersonalityPrefix(effectiveText);

    try {
      const aiResponse = await streamPublicChatMessage(
        effectiveText,
        {
          history: buildHistory(nextMessages),
          sessionMemory: nextMemory,
          imageDataUrl: imageDataUrl || undefined,
        },
        {
          onToken: (_delta, fullText) => {
            setIsTyping(false);
            setPendingQuery("");
            const display =
              personalityPrefix && !fullText.startsWith(personalityPrefix)
                ? `${personalityPrefix}\n\n${fullText}`
                : fullText;
            if (!streamStarted) {
              streamStarted = true;
              setStreamingMessageId(aiMessageId);
              setMessages((prev) => [
                ...prev,
                {
                  id: aiMessageId,
                  role: "assistant" as const,
                  content: display,
                  meta: { userQuery: effectiveText },
                },
              ]);
              return;
            }
            setMessages((prev) =>
              prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: display } : msg))
            );
          },
          onLimit: () => {
            setIsTyping(false);
            setStreamingMessageId(null);
            setRemaining(0);
            setShowLimitModal(true);
          },
        }
      );

      if (aiResponse.limitReached) {
        setIsTyping(false);
        return;
      }

      if (typeof aiResponse.remaining === "number") {
        setRemaining(aiResponse.remaining);
      }

      setIsTyping(false);
      setPendingQuery("");
      setStreamingMessageId(null);

      const responseTimeMs = Date.now() - requestStartedAt;
      playAiCompleteSound();

      setMessages((current) => {
        const exists = current.some((m) => m.id === aiMessageId);
        const finalContent = prependPersonality(aiResponse.message || "", effectiveText);
        const updated = exists
          ? current.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: finalContent || msg.content,
                    structuredMessage: aiResponse.structuredMessage
                      ? {
                          ...aiResponse.structuredMessage,
                          rawText: finalContent || msg.content,
                          shortExplanation: finalContent || msg.content,
                        }
                      : msg.structuredMessage,
                    meta: { userQuery: effectiveText, responseTimeMs },
                  }
                : msg
            )
          : [
              ...current,
              {
                id: aiMessageId,
                role: "assistant" as const,
                content: finalContent,
                structuredMessage: aiResponse.structuredMessage,
                meta: { userQuery: effectiveText, responseTimeMs },
              },
            ];
        persistChat(chatId, updated);
        return updated;
      });
    } catch {
      setIsTyping(false);
      setPendingQuery("");
      if (streamStarted) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: "Sorry, something went wrong. Please try again." }
              : msg
          )
        );
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            role: "assistant" as const,
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      }
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
      <input
        ref={imageInputRef}
        type="file"
        accept={CHAT_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          void handleImageSelected(file);
          event.target.value = "";
        }}
      />
      {pendingImageUrl ? (
        <div className="mb-2 px-1">
          <AiImagePreview imageUrl={pendingImageUrl} onRemove={() => setPendingImageUrl(null)} />
        </div>
      ) : null}
      {imageError ? <p className="mb-2 px-1 text-xs text-red-600">{imageError}</p> : null}
      <motion.form
        initial={false}
        whileHover={{ scale: 1.005 }}
        onSubmit={(e) => void handleSend(input, e)}
        className="relative flex items-end gap-2 rounded-[20px] border border-white/70 bg-white/75 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl transition focus-within:border-[#BFFF07]/40 focus-within:shadow-[0_12px_40px_rgba(191,255,7,0.12)]"
      >
        <AiInputSuggestions
          suggestions={inputSuggestions}
          onSelect={(value) => {
            setInput(value);
            void handleSend(value);
          }}
        />
        <AiAttachMenu
          disabled={isTyping}
          onPickImage={() => imageInputRef.current?.click()}
          onQuickPrompt={(prompt) => {
            setInput(prompt);
            void handleSend(prompt);
          }}
          onWebSearch={() => {
            const prompt = "UK diesel price today";
            setInput(prompt);
            void handleSend(prompt);
          }}
        />

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
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVoice}
              disabled={isTyping}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isListening ? "bg-red-50 text-red-600" : "text-[#666] hover:bg-[#f4f4f4]/80"
              }`}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </motion.button>
          )}
          <motion.button
            type="submit"
            whileHover={{ scale: input.trim() || pendingImageUrl ? 1.08 : 1 }}
            whileTap={{ scale: 0.95 }}
            disabled={isTyping || (!input.trim() && !pendingImageUrl)}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              input.trim() || pendingImageUrl ? "bg-[#0d0d0d] text-white shadow-md hover:bg-[#333]" : "bg-[#f4f4f4] text-[#bbb]"
            } disabled:opacity-50`}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2L4 12h6v10l8-12h-6V2z" />
            </svg>
          </motion.button>
        </div>
      </motion.form>
      <p className="mt-3 text-center text-xs text-[#999]">
        Alpha Freight AI · Enter to send · Shift+Enter new line · Ctrl+K new chat
      </p>
    </div>
  );

  return (
    <div
      className={`relative flex overflow-hidden bg-white text-[#0d0d0d] ${
        embedded ? "h-full min-h-0" : "h-[100dvh]"
      }`}
    >
      <AiPageBackground />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
      <LimitReachedModal open={showLimitModal} onClose={() => setShowLimitModal(false)} />
      {userRole && (userRole === "carrier" || userRole === "supplier") ? (
        <CopilotUpgradeBanner role={userRole} />
      ) : null}
      <aside
        className={`hidden shrink-0 flex-col border-r border-[#e5e5e5]/80 bg-[#f9f9f9]/80 backdrop-blur-md transition-all duration-300 md:flex ${
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
                <NavbarAiLottie className="h-20 w-20" />
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
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void handleSend(prompt)}
                    disabled={isTyping}
                    className="rounded-full border border-[#e5e5e5]/80 bg-white/80 px-4 py-2 text-sm text-[#444] shadow-sm backdrop-blur-sm transition hover:border-[#BFFF07]/40 hover:shadow-md disabled:opacity-50"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      {message.role === "user" ? (
                        <div className="flex justify-end">
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="max-w-[85%] rounded-[20px] border border-white/60 bg-white/70 px-5 py-3.5 text-[15px] leading-relaxed text-[#0d0d0d] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl"
                          >
                            {message.imageUrl ? (
                              <div className="mb-3 overflow-hidden rounded-xl border border-[#ececec]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={message.imageUrl}
                                  alt="Uploaded"
                                  className="max-h-56 w-full object-cover"
                                />
                              </div>
                            ) : null}
                            {message.content}
                          </motion.div>
                        </div>
                      ) : (
                        <div className="group flex gap-4">
                          <NavbarAiLottie className="mt-0.5 h-9 w-9 shrink-0" />
                          <div className="min-w-0 flex-1 pt-0.5">
                            <AssistantReply
                              reply={message.structuredMessage}
                              content={message.content}
                              isStreaming={streamingMessageId === message.id}
                            />

                            <PublicAiMessageExtras
                              structuredMessage={message.structuredMessage}
                              userQuery={message.meta?.userQuery}
                              hasContent={Boolean(message.content)}
                              isStreaming={streamingMessageId === message.id}
                              onAskFollowUp={(q) => void handleSend(q)}
                            />

                            {message.content && streamingMessageId !== message.id ? (
                              <AiConfidenceFooter
                                responseTimeMs={message.meta?.responseTimeMs}
                                knowledgeSource={message.structuredMessage?.knowledgeSource}
                              />
                            ) : null}

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

                            {(message.structuredMessage?.suggestedQuestions?.length ?? 0) > 0 &&
                              message.structuredMessage?.suggestedQuestions?.map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => void handleSend(q.replace(/^[^\w]+/, "").trim() || q)}
                                  className="mt-2 mr-2 inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] px-3 py-1.5 text-sm text-[#666] hover:bg-[#f7f7f8]"
                                >
                                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#7a9900]" />
                                  {q}
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  <AnimatePresence>
                  {isTyping && pendingQuery ? (
                    <AiThinkingIndicator query={pendingQuery} />
                  ) : null}
                  </AnimatePresence>
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
    </div>
  );
}
