"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Plus, Send, Sparkles, SquarePen, Trash2 } from "lucide-react";
import AiRichMarkdown from "@/components/marketing/AiRichMarkdown";
import AiThinkingIndicator from "@/components/marketing/AiThinkingIndicator";
import { streamPublicChatMessage } from "@/lib/api";
import { buildPublicInstantSocialReply } from "@/lib/public-ai-instant-replies";
import { EMPLOYEE_AI_SUGGESTIONS } from "@/lib/employee-team-ai-prompt";
import {
  deleteEmployeeTeamAiChat,
  loadEmployeeTeamAiChats,
  saveEmployeeTeamAiChat,
  type EmployeeStoredChat,
  type EmployeeStoredChatMessage,
} from "@/lib/employee-team-ai-storage";
import { playAiCompleteSound } from "@/lib/ai-complete-sound";
import type { ChatHistoryItem, StructuredAssistantReply } from "@/lib/chat-types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  structuredMessage?: StructuredAssistantReply;
}

function buildHistory(messages: Message[]): ChatHistoryItem[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

function toStoredMessages(messages: Message[]): EmployeeStoredChatMessage[] {
  return messages.map(({ id, role, content }) => ({ id, role, content }));
}

export default function EmployeeTeamAiApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState("");
  const [recentChats, setRecentChats] = useState<EmployeeStoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setRecentChats(loadEmployeeTeamAiChats());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, pendingQuery]);

  const persistChat = useCallback((chatId: string, nextMessages: Message[]) => {
    if (!nextMessages.length) return;
    const firstUser = nextMessages.find((m) => m.role === "user")?.content || "New chat";
    const chat: EmployeeStoredChat = {
      id: chatId,
      title: firstUser.slice(0, 48),
      messages: toStoredMessages(nextMessages),
      updatedAt: Date.now(),
    };
    setRecentChats(saveEmployeeTeamAiChat(chat));
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setInput("");
    setPendingQuery("");
    setStreamingMessageId(null);
  };

  const loadChat = (chat: EmployeeStoredChat) => {
    setMessages(chat.messages.map((m) => ({ ...m })));
    setActiveChatId(chat.id);
  };

  const handleSend = async (text: string = input, e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) return;

    const chatId = activeChatId || Date.now().toString();
    if (!activeChatId) setActiveChatId(chatId);

    const priorHistory = buildHistory(messages);
    const instantSocial = buildPublicInstantSocialReply(trimmedText, priorHistory);

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedText,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (instantSocial) {
      const aiMessageId = `${Date.now()}-assistant`;
      const body = instantSocial.message || instantSocial.structuredMessage?.shortExplanation || "";
      const withAssistant = [
        ...nextMessages,
        {
          id: aiMessageId,
          role: "assistant" as const,
          content: body,
          structuredMessage: instantSocial.structuredMessage,
        },
      ];
      setMessages(withAssistant);
      playAiCompleteSound();
      persistChat(chatId, withAssistant);
      return;
    }

    setPendingQuery(trimmedText);
    const aiMessageId = `${Date.now()}-assistant`;
    setIsTyping(true);
    setStreamingMessageId(null);

    let streamStarted = false;

    try {
      const aiResponse = await streamPublicChatMessage(
        trimmedText,
        { history: buildHistory(nextMessages), assistantType: "employee" },
        {
          onToken: (_delta, fullText) => {
            setIsTyping(false);
            setPendingQuery("");
            if (!streamStarted) {
              streamStarted = true;
              setStreamingMessageId(aiMessageId);
              setMessages((prev) => [
                ...prev,
                { id: aiMessageId, role: "assistant" as const, content: fullText },
              ]);
              return;
            }
            setMessages((prev) =>
              prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: fullText } : msg))
            );
          },
        }
      );

      setIsTyping(false);
      setPendingQuery("");
      setStreamingMessageId(null);
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
                    structuredMessage: aiResponse.structuredMessage,
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
              },
            ];
        persistChat(chatId, updated);
        return updated;
      });
    } catch {
      setIsTyping(false);
      setPendingQuery("");
      const errorMsg = "Sorry, something went wrong. Please try again.";
      if (streamStarted) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: errorMsg } : msg))
        );
      } else {
        setMessages((prev) => [
          ...prev,
          { id: aiMessageId, role: "assistant" as const, content: errorMsg },
        ]);
      }
    }
  };

  const handleCopy = async (messageId: string) => {
    const text = messages.find((m) => m.id === messageId)?.content;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDeleteChat = (id: string) => {
    setRecentChats(deleteEmployeeTeamAiChat(id));
    if (activeChatId === id) handleNewChat();
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-5rem)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200/90 bg-white lg:flex">
          <div className="border-b border-slate-100 p-4">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <SquarePen className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {recentChats.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-400">No recent chats</p>
            ) : (
              recentChats.map((chat) => (
                <div key={chat.id} className="group relative mb-1">
                  <button
                    type="button"
                    onClick={() => loadChat(chat)}
                    className={`w-full rounded-lg px-3 py-2.5 pr-8 text-left text-xs font-medium transition ${
                      activeChatId === chat.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="line-clamp-2">{chat.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChat(chat.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[#FDFDFD]">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <Sparkles className="h-4 w-4 text-[#FFD666]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Team AI</h1>
              <p className="text-[11px] text-slate-500">Sales coach · CRM help · scripts & freight knowledge</p>
            </div>
            <button
              type="button"
              onClick={handleNewChat}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 lg:hidden"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {isEmpty ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center pt-8 text-center sm:pt-16">
                <div className="relative mb-6 h-16 w-16">
                  <Image src="/logo.png" alt="Team AI" fill className="object-contain" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">How can I help your sales day?</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ask for call scripts, objection handling, follow-up emails, CRM tips, or UK freight calculations.
                </p>
                <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
                  {EMPLOYEE_AI_SUGGESTIONS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void handleSend(prompt)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" ? (
                      <div className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#FFD666]/40">
                        <Image src="/logo.png" alt="Team AI" fill className="object-contain p-1" />
                      </div>
                    ) : null}
                    <div
                      className={`group relative max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200/90 bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="text-[15px] leading-relaxed">
                          <AiRichMarkdown
                            content={message.content}
                            isStreaming={streamingMessageId === message.id}
                          />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                      )}
                      {message.role === "assistant" && streamingMessageId !== message.id ? (
                        <button
                          type="button"
                          onClick={() => void handleCopy(message.id)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400 opacity-0 transition hover:text-slate-600 group-hover:opacity-100"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))}

                <AnimatePresence>
                  {isTyping && pendingQuery ? <AiThinkingIndicator query={pendingQuery} /> : null}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
            <form onSubmit={(e) => void handleSend(input, e)} className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/10">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask Team AI — scripts, objections, CRM, commission…"
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Team AI — trained on sales scripts, CRM & UK freight · OpenAI when online
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
