"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Menu,
  Mic,
  Home,
  PanelLeftClose,
  PanelLeft,
  Search,
  SquarePen,
  Trash2,
  Truck,
  X,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { streamPublicChatMessage } from "@/lib/api";
import { buildPublicInstantSocialReply } from "@/lib/public-ai-instant-replies";
import {
  PUBLIC_AI_MESSAGE_LIMIT,
  PUBLIC_AI_ACCOUNT_HUB_PATH,
  getMemberDashboardPath,
} from "@/lib/public-ai-rate-limit";
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
import { publicAiReplyFontClass } from "@/lib/public-ai-fonts";
import AiPageBackground from "@/components/marketing/ai/AiPageBackground";
import AiInputSuggestions from "@/components/marketing/ai/AiInputSuggestions";
import AiAttachMenu, { AiImagePreview } from "@/components/marketing/ai/AiAttachMenu";
import AiReplyActions from "@/components/marketing/ai/AiReplyActions";
import {
  CHAT_IMAGE_ACCEPT,
  DEFAULT_CHAT_IMAGE_PROMPT,
  readChatImageFile,
} from "@/lib/chat-image-upload";
import PublicAiMessageExtras from "@/components/marketing/ai/PublicAiMessageExtras";
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

function SidebarReveal({
  show,
  children,
  className = "",
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        maxWidth: show ? 220 : 0,
        marginRight: show ? 0 : -6,
      }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={`min-w-0 overflow-hidden whitespace-nowrap ${className}`}
      aria-hidden={!show}
    >
      {children}
    </motion.div>
  );
}

const AI_REPLY_TEXT = publicAiReplyFontClass;

function AssistantReply({ reply, content, isStreaming }: { reply?: StructuredAssistantReply; content: string; isStreaming?: boolean }) {
  const markdown = (reply?.rawText || reply?.shortExplanation || content).trim();

  if (isStreaming || !reply || reply.displayStyle === "plain") {
    return (
      <div className={`space-y-3 ${AI_REPLY_TEXT}`}>
        <AiRichMarkdown content={markdown} isStreaming={isStreaming} serif />
        {!isStreaming && reply?.quickActions && reply.quickActions.length > 0 ? (
          <QuickActionLinks actions={reply.quickActions} />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${AI_REPLY_TEXT}`}>
      {reply.title ? <p className="font-semibold text-[#050505]">{reply.title}</p> : null}
      {reply.shortExplanation ? <AiRichMarkdown content={reply.shortExplanation} serif /> : null}
      {reply.keyPoints && reply.keyPoints.length > 0 ? (
        <ul className="space-y-2 pl-1">
          {reply.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFFF07]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {reply.recommendation ? (
        <div className={`flex gap-2.5 rounded-xl border border-[#BFFF07]/40 bg-[#f7ffe8] px-4 py-3 text-[#3d4d00] ${publicAiReplyFontClass}`}>
          <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-[#7a9900]" />
          <span>{reply.recommendation}</span>
        </div>
      ) : null}
      {reply.nextStep ? <p className="text-[16px] text-[#333]">{reply.nextStep}</p> : null}
      {reply.quickActions && reply.quickActions.length > 0 ? (
        <QuickActionLinks actions={reply.quickActions} />
      ) : null}
      {!reply.shortExplanation && !reply.keyPoints?.length && content ? (
        <AiRichMarkdown content={content} serif />
      ) : null}
    </div>
  );
}

export default function PublicFreightAiApp({ embedded = false, initialPrompt }: PublicFreightAiAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [remaining, setRemaining] = useState(PUBLIC_AI_MESSAGE_LIMIT);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [recentChats, setRecentChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalVariant, setLimitModalVariant] = useState<"guest" | "member">("guest");
  const [sessionMemory, setSessionMemory] = useState<PublicAiSessionMemory>(() => loadPublicAiMemory());
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const initialQueryHandled = useRef(false);

  const hasConversation = messages.some((m) => m.role === "user");
  const memberDashboardHref = getMemberDashboardPath(userRole);
  const accountHubHref = PUBLIC_AI_ACCOUNT_HUB_PATH;

  const inputSuggestions = matchInputSuggestions(input);
  const firstUserQuery = messages.find((m) => m.role === "user")?.content || "";
  const latestAssistantMessageId =
    [...messages].reverse().find((message) => message.role === "assistant" && message.content)?.id ?? null;

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
    const syncAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsSignedIn(false);
        setUserRole(null);
        setAuthReady(true);
        return;
      }

      setIsSignedIn(true);
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role) setUserRole(String(data.role));
      setAuthReady(true);
    };

    void syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setIsSignedIn(false);
        setUserRole(null);
        setAuthReady(true);
        return;
      }

      setIsSignedIn(true);
      void supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.role) setUserRole(String(data.role));
          setAuthReady(true);
        });
    });

    return () => subscription.unsubscribe();
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
    items.slice(isSignedIn ? -22 : -16).map((item) => ({
      role: item.role,
      content: (item.content || buildDisplayText(item.structuredMessage)).slice(0, isSignedIn ? 1800 : 1500),
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
      const body = buildDisplayText(instantSocial.structuredMessage, instantSocial.message);
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
            const display = fullText;
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
          onLimit: (result) => {
            setIsTyping(false);
            setStreamingMessageId(null);
            setRemaining(0);
            setLimitModalVariant(result?.limitType === "member" ? "member" : "guest");
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
        const finalContent = aiResponse.message || "";
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

  const handleRegenerate = async (assistantId: string) => {
    if (isTyping) return;

    const assistantIdx = messages.findIndex((message) => message.id === assistantId);
    if (assistantIdx <= 0) return;

    let userIdx = assistantIdx - 1;
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx -= 1;
    if (userIdx < 0) return;

    const userMsg = messages[userIdx];
    const truncated = messages.slice(0, assistantIdx);
    const effectiveText =
      userMsg.meta?.userQuery ||
      (userMsg.content === "📷 Image uploaded" ? DEFAULT_CHAT_IMAGE_PROMPT : userMsg.content);
    const imageDataUrl = userMsg.imageUrl || null;
    const chatId = activeChatId || Date.now().toString();

    setMessages(truncated);
    setPendingQuery(effectiveText);
    setIsTyping(true);
    setStreamingMessageId(null);

    const aiMessageId = `${Date.now()}-assistant`;
    const requestStartedAt = Date.now();
    let streamStarted = false;

    try {
      const aiResponse = await streamPublicChatMessage(
        effectiveText,
        {
          history: buildHistory(truncated.slice(0, userIdx)),
          sessionMemory,
          imageDataUrl: imageDataUrl || undefined,
        },
        {
          onToken: (_delta, fullText) => {
            setIsTyping(false);
            setPendingQuery("");
            const display = fullText;
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
          onLimit: (result) => {
            setIsTyping(false);
            setStreamingMessageId(null);
            setRemaining(0);
            setLimitModalVariant(result?.limitType === "member" ? "member" : "guest");
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
        const exists = current.some((message) => message.id === aiMessageId);
        const finalContent = aiResponse.message || "";
        const updated = exists
          ? current.map((message) =>
              message.id === aiMessageId
                ? {
                    ...message,
                    content: finalContent || message.content,
                    structuredMessage: aiResponse.structuredMessage
                      ? {
                          ...aiResponse.structuredMessage,
                          rawText: finalContent || message.content,
                          shortExplanation: finalContent || message.content,
                        }
                      : message.structuredMessage,
                    meta: { userQuery: effectiveText, responseTimeMs },
                  }
                : message
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
      setStreamingMessageId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant" as const,
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    }
  };

  const handleBranchNewChat = (userQuery?: string) => {
    handleNewChat();
    if (userQuery?.trim()) {
      window.setTimeout(() => void handleSend(userQuery.trim()), 200);
    }
  };

  const sidebarExpanded = sidebarOpen || mobileSidebar;

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="flex items-center gap-3 px-3 py-4 pr-10 md:pr-3">
        <Link href="/" className="relative h-8 w-8 shrink-0 transition hover:opacity-80" title="Home">
          <Image src="/logo.png" alt="Alpha Freight — Home" fill className="object-contain" />
        </Link>
        <SidebarReveal show={sidebarExpanded} className="flex-1">
          <Link href="/" className="block truncate text-sm font-semibold text-[#0d0d0d] transition hover:text-[#666]">
            Alpha Freight AI
          </Link>
        </SidebarReveal>
      </div>

      <div className="space-y-1 px-2">
        <button
          type="button"
          onClick={() => {
            handleNewChat();
            setMobileSidebar(false);
          }}
          className="public-ai-sidebar-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#0d0d0d]"
          title="New chat"
        >
          <SquarePen className="h-4 w-4 shrink-0" />
          <SidebarReveal show={sidebarExpanded} className="flex-1">
            <span className="block text-left">
              New chat{" "}
              <span className="hidden text-[10px] text-[#999] md:inline">Ctrl+K</span>
            </span>
          </SidebarReveal>
        </button>
      </div>

      <SidebarReveal show={sidebarExpanded} className="mt-4 flex-1 px-2">
        <div className="flex h-full flex-col overflow-hidden">
          <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-[#999]">
            Recent chats
          </p>
          {recentChats.length > 0 ? (
            <div className="max-h-[min(320px,40vh)] space-y-0.5 overflow-y-auto">
              {recentChats.map((chat) => (
                <div key={chat.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      loadChat(chat);
                      setMobileSidebar(false);
                    }}
                    className={`public-ai-sidebar-item min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-sm ${
                      activeChatId === chat.id ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500"
                    }`}
                  >
                    <span className="block truncate">{chat.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentChats(deleteRecentChat(chat.id))}
                    className="rounded-lg p-1.5 text-neutral-300 opacity-100 transition hover:bg-neutral-100 hover:text-neutral-600 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-[#999]">No chats yet — start a conversation.</p>
          )}
        </div>
      </SidebarReveal>

      <SidebarReveal show={sidebarExpanded}>
        <div className="mt-4 px-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#999]">Explore</p>
        </div>
        <nav className="space-y-0.5 px-2">
          {SIDEBAR_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="public-ai-sidebar-item flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#444] hover:text-[#0d0d0d]"
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
      </SidebarReveal>

      <div className="mt-auto border-t border-neutral-200/80 p-3">
        <SidebarReveal show={sidebarExpanded}>
          <div className="space-y-3">
            {!isSignedIn ? (
              <p className="px-1 text-xs text-[#666]">
                {remaining} free question{remaining === 1 ? "" : "s"} left
              </p>
            ) : null}
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            {authReady && isSignedIn ? (
              <Link
                href={accountHubHref}
                className="flex w-full items-center justify-center rounded-xl bg-[#0d0d0d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
              >
                Dashboard
              </Link>
            ) : authReady ? (
              <>
                <Link
                  href={accountHubHref}
                  className="flex w-full items-center justify-center rounded-xl bg-[#0d0d0d] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#333]"
                >
                  Sign up free
                </Link>
                <Link
                  href={accountHubHref}
                  className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
                >
                  Sign in
                </Link>
              </>
            ) : null}
            {!isSignedIn && authReady ? <EmailCaptureBar /> : null}
          </div>
        </SidebarReveal>
      </div>
    </div>
  );

  const renderInputBox = (menuOpensUp: boolean) => (
    <div className="mx-auto w-full max-w-2xl">
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
        <div className="mb-3 px-2">
          <AiImagePreview imageUrl={pendingImageUrl} onRemove={() => setPendingImageUrl(null)} />
        </div>
      ) : null}
      {imageError ? <p className="mb-2 px-2 text-xs text-red-600">{imageError}</p> : null}

      <div className="relative">
        <form
          onSubmit={(e) => void handleSend(input, e)}
          className="public-ai-input-shell relative flex items-end gap-0.5 overflow-visible rounded-full border border-neutral-200 bg-white px-1.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:gap-1 sm:px-2 focus-within:border-neutral-300 focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
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
            menuPlacement={menuOpensUp ? "up" : "down"}
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
            placeholder="Ask Alpha Freight AI"
            disabled={isTyping}
            className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[15px] leading-relaxed text-[#0d0d0d] placeholder:text-[#9aa0a6] focus:outline-none disabled:opacity-60 sm:min-h-[42px] sm:px-2 sm:text-[14px]"
          />

          <div className="mb-1 flex shrink-0 items-center gap-0.5 pr-1">
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isTyping}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition sm:h-9 sm:w-9 ${
                  isListening ? "bg-red-50 text-red-600" : "text-[#5f6368] hover:bg-[#f1f3f4] active:scale-95"
                }`}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isTyping || (!input.trim() && !pendingImageUrl)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 sm:h-9 sm:w-9 ${
                input.trim() || pendingImageUrl
                  ? "bg-[#0d0d0d] text-white hover:bg-[#333]"
                  : "bg-[#f1f3f4] text-[#bdc1c6]"
              } disabled:opacity-50`}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2L4 12h6v10l8-12h-6V2z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {!hasConversation ? (
        <p className="mt-4 text-center text-xs text-[#9aa0a6]">
          Enter to send · Shift+Enter new line
        </p>
      ) : (
        <p className="mt-3 text-center text-xs text-[#9aa0a6]">
          Alpha Freight AI · Ctrl+K new chat
        </p>
      )}
    </div>
  );

  return (
    <div
      className={`public-ai-app relative flex overflow-hidden bg-white text-neutral-900 ${
        embedded ? "h-full min-h-0" : "h-[100dvh]"
      }`}
    >
      <AiPageBackground />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
      <LimitReachedModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        variant={limitModalVariant}
        dashboardHref={memberDashboardHref}
      />
      {userRole && (userRole === "carrier" || userRole === "supplier") ? (
        <CopilotUpgradeBanner role={userRole} />
      ) : null}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 52 }}
        transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.85 }}
        className="public-ai-sidebar hidden shrink-0 overflow-hidden md:flex md:flex-col"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[3px] md:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="public-ai-sidebar public-ai-sidebar-mobile fixed inset-y-0 left-0 z-50 w-[min(88vw,280px)] md:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileSidebar(false)}
                className="absolute right-3 top-3 rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-w-0 flex-1 flex-col"
      >
        <header className="public-ai-header public-ai-header-bar relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileSidebar(true)}
              className="public-ai-header-btn rounded-xl p-2.5 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="public-ai-header-btn hidden rounded-xl p-2 md:flex"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={sidebarOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -90, scale: 0.85 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.85 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center"
                >
                  {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
            <Link
              href="/"
              className="public-ai-header-link flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium sm:py-1.5"
            >
              <Home className="h-4 w-4 shrink-0 text-neutral-500" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/find-loads"
              className="public-ai-header-pill rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Loads</span>
              <span className="hidden sm:inline">Find loads</span>
            </Link>
            {authReady && isSignedIn ? (
              <Link
                href={accountHubHref}
                className="rounded-full bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#333] active:scale-[0.98] sm:px-4 sm:text-sm"
              >
                Dashboard
              </Link>
            ) : authReady ? (
              <Link
                href={accountHubHref}
                className="rounded-full bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#333] active:scale-[0.98] sm:px-4 sm:text-sm"
              >
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Sign up free</span>
              </Link>
            ) : null}
          </div>
        </header>

        <div className={`flex flex-1 flex-col ${hasConversation ? "overflow-hidden" : "overflow-visible"}`}>
          <AnimatePresence mode="wait">
          {!hasConversation ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-1 flex-col items-center justify-center overflow-visible px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-8 sm:pt-4"
            >
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
                className="public-ai-empty-title mb-6 max-w-lg text-center text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.03em] text-neutral-900 sm:mb-8"
              >
                Any freight questions to explore?
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="w-full max-w-2xl"
              >
                {renderInputBox(false)}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="public-ai-scroll flex-1 overflow-y-auto">
                <div className="public-ai-message-list mx-auto max-w-3xl space-y-6 px-3 py-5 sm:space-y-8 sm:px-4 sm:py-8">
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            className="public-ai-user-bubble max-w-[min(92%,28rem)] rounded-[20px] bg-[#e8e8ec] px-3.5 py-2.5 text-[15px] leading-relaxed text-[#0d0d0d] sm:max-w-[85%] sm:px-4 sm:py-3"
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
                        <div className="group flex gap-2.5 sm:gap-4">
                          <NavbarAiLottie className="mt-0.5 h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                            className="relative min-w-0 flex-1 pt-0.5"
                          >
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

                            {message.content && streamingMessageId !== message.id && (
                              <AiReplyActions
                                messageId={message.id}
                                isLatest={message.id === latestAssistantMessageId}
                                copied={copiedId === message.id}
                                shared={sharedId === message.id}
                                feedback={feedback[message.id] ?? null}
                                responseTimeMs={message.meta?.responseTimeMs}
                                knowledgeSource={message.structuredMessage?.knowledgeSource}
                                userQuery={message.meta?.userQuery}
                                onFeedback={(value) =>
                                  setFeedback((current) => ({
                                    ...current,
                                    [message.id]: current[message.id] === value ? null : value,
                                  }))
                                }
                                onCopy={() => void handleCopy(message.id)}
                                onRegenerate={() => void handleRegenerate(message.id)}
                                onWhatsAppShare={() => handleWhatsAppShare(message.id)}
                                onCopyShareLink={() => void handleCopyShareLink(message.id)}
                                onBranchNewChat={() => handleBranchNewChat(message.meta?.userQuery)}
                              />
                            )}

                          </motion.div>
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

              <div className="public-ai-composer-dock shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:py-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderInputBox(true)}
                </motion.div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
