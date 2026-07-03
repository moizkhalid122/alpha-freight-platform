"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, User, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import { sendChatMessage } from "@/lib/api";
import { getSuggestedPrompts, getThinkingStates, getTypingDelay, waitForMinimumDuration } from "@/lib/chat-ui";
import AssistantMessageActions from "@/components/chat/AssistantMessageActions";
import CopilotResponseCard from "@/components/chat/CopilotResponseCard";
import CopilotMemoryBar from "@/components/chat/CopilotMemoryBar";
import ChatModeSwitcher from "@/components/chat/ChatModeSwitcher";
import AssistantMessageHeader from "@/components/chat/AssistantMessageHeader";
import ThinkingStateCard from "@/components/chat/ThinkingStateCard";
import type {
  ChatHistoryItem,
  CopilotMode,
  CopilotContextMemory,
  CopilotQuickAction,
  StructuredAssistantReply,
} from "@/lib/chat-types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  structuredMessage?: StructuredAssistantReply;
}

const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm Alpha Freight AI. How can I help you today? Ask about services, shipping, or how to get started!",
    timestamp: getTimestamp(),
  },
];

const suggestedQuestions = getSuggestedPrompts("general");
const thinkingStates = getThinkingStates("general");

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [moreMessageId, setMoreMessageId] = useState<string | null>(null);
  const [sessionMemory, setSessionMemory] = useState<CopilotContextMemory | null>(null);
  const [selectedMode, setSelectedMode] = useState<CopilotMode>("logistics_copilot");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) {
      setThinkingStep(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setThinkingStep((current) => (current + 1) % thinkingStates.length);
    }, 1700);

    return () => window.clearInterval(intervalId);
  }, [isTyping]);

  const buildHistory = (items: Message[]): ChatHistoryItem[] =>
    items.slice(-6).map((item) => ({
      role: item.role,
      content: item.content,
    }));

  const markCopied = (messageId: string) => {
    setCopiedMessageId(messageId);
    window.setTimeout(() => {
      setCopiedMessageId((current) => (current === messageId ? null : current));
    }, 1800);
  };

  const handleCopy = async (messageId: string) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    if (!targetMessage?.content) return;

    try {
      await navigator.clipboard.writeText(targetMessage.content);
      markCopied(messageId);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleFeedback = (messageId: string, value: "up" | "down") => {
    setMessageFeedback((current) => ({
      ...current,
      [messageId]: current[messageId] === value ? null : value,
    }));
  };

  const handleShare = async (messageId: string) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    if (!targetMessage?.content) return;

    try {
      if (navigator.share) {
        await navigator.share({
          text: targetMessage.content,
        });
        return;
      }

      await navigator.clipboard.writeText(targetMessage.content);
      markCopied(messageId);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleMore = (messageId: string) => {
    setMoreMessageId((current) => (current === messageId ? null : messageId));
  };

  const handleQuickAction = async (action: CopilotQuickAction) => {
    if (action.action) {
      await handleSend(action.action);
    }
  };

  // Typing animation function
  const typeMessage = async (fullText: string, messageId: string) => {
    let currentText = "";
    const words = fullText.split(" ");
    setStreamingMessageId(messageId);

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === messageId ? { ...msg, content: currentText } : msg
        )
      );
      await new Promise((resolve) => setTimeout(resolve, getTypingDelay(words[i])));
    }

    setStreamingMessageId(null);
  };

  const streamAssistantReply = async (
    fullText: string,
    messageId: string,
    structuredMessage?: StructuredAssistantReply
  ) => {
    await typeMessage(fullText, messageId);
    if (!structuredMessage) return;

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, structuredMessage } : message
      )
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
      timestamp: getTimestamp(),
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
      });
      await waitForMinimumDuration(thinkingStartedAt);
      const aiMessageId = (Date.now() + 1).toString();
      setIsTyping(false);

      if (aiResponse.structuredMessage?.memory) {
        setSessionMemory(aiResponse.structuredMessage.memory);
      }

      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      await streamAssistantReply(aiResponse.message, aiMessageId, aiResponse.structuredMessage);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsTyping(false);
      setStreamingMessageId(null);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (isTyping) return;

    const targetIndex = messages.findIndex((message) => message.id === messageId);
    if (targetIndex === -1) return;

    let userIndex = -1;
    for (let index = targetIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") {
        userIndex = index;
        break;
      }
    }

    if (userIndex === -1) return;

    const prompt = messages[userIndex].content;
    const history = buildHistory(messages.slice(0, userIndex));
    const thinkingStartedAt = Date.now();

    setMoreMessageId(null);
    setIsTyping(true);
    setStreamingMessageId(messageId);
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, content: "", structuredMessage: undefined } : message
      )
    );

    try {
      const aiResponse = await sendChatMessage(prompt, {
        assistantType: "general",
        mode: selectedMode,
        history,
      });

      await waitForMinimumDuration(thinkingStartedAt);
      setIsTyping(false);
      if (aiResponse.structuredMessage?.memory) {
        setSessionMemory(aiResponse.structuredMessage.memory);
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, timestamp: getTimestamp() } : message
        )
      );
      await streamAssistantReply(aiResponse.message, messageId, aiResponse.structuredMessage);
    } catch (error) {
      console.error("Regenerate failed:", error);
      setIsTyping(false);
      setStreamingMessageId(null);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
              ? { ...message, content: "Sorry, I encountered an error. Please try again later.", timestamp: getTimestamp() }
            : message
        )
      );
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/30 ring-4 ring-white/80"
      >
        <div className="h-8 w-8 relative">
          <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain" />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 flex h-[640px] w-[90vw] max-w-[420px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/12 ring-1 ring-slate-200/70 md:bottom-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-1" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">Alpha Freight AI</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      <Sparkles className="h-3 w-3" />
                      Beta
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Online now
                  </p>
                </div>
              </div>
              <div className="hidden max-w-[210px] lg:block">
                <ChatModeSwitcher value={selectedMode} onChange={setSelectedMode} compact />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50/70 p-4 space-y-4">
              {sessionMemory && <CopilotMemoryBar memory={sessionMemory} />}
              <div className="lg:hidden">
                <ChatModeSwitcher value={selectedMode} onChange={setSelectedMode} compact />
              </div>
              {messages.map((message) => (
                (() => {
                  const shouldRenderCard = Boolean(
                    message.structuredMessage &&
                      (
                        message.structuredMessage.displayStyle === "card" ||
                        message.structuredMessage.platformResult?.loads?.length ||
                        message.structuredMessage.quickActions?.length ||
                        message.structuredMessage.actionRequest
                      )
                  );

                  return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="max-w-[80%]">
                      <AssistantMessageHeader
                        assistantName={message.structuredMessage?.assistantName}
                        timestamp={message.timestamp}
                      />
                      {!shouldRenderCard ? (
                        <div className="px-0 py-1 text-slate-900">
                          <p className="text-sm leading-7 whitespace-pre-line">{message.content}</p>
                        </div>
                      ) : (
                        <CopilotResponseCard
                          response={message.structuredMessage}
                          fallbackText={message.content}
                          onQuickAction={handleQuickAction}
                        />
                      )}
                      {message.content && streamingMessageId !== message.id && (
                        <>
                          <AssistantMessageActions
                            messageId={message.id}
                            isCopied={copiedMessageId === message.id}
                            feedback={messageFeedback[message.id] || null}
                            onCopy={handleCopy}
                            onFeedback={handleFeedback}
                            onShare={handleShare}
                            onRegenerate={handleRegenerate}
                            onMore={handleMore}
                          />
                          {moreMessageId === message.id && (
                            <p className="mt-1 text-xs text-slate-400">
                              More actions coming soon.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-slate-100 px-4 py-3 text-slate-900">
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  )}
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
                  );
                })()
              ))}
              {!isTyping && messages.length === initialMessages.length && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200/50 backdrop-blur"
                >
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Try Asking
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleSend(question)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                      >
                        <span>{question}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {isTyping && (
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                  <ThinkingStateCard states={thinkingStates} activeIndex={thinkingStep} />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => handleSend(input, e)} className="border-t border-slate-100 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask Alpha Freight AI..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
