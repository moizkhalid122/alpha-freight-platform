"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, PenLine, Send, User, Sparkles, PoundSterling, LocateFixed } from "lucide-react";
import Image from "next/image";
import { sendChatMessage } from "@/lib/api";
import { getSuggestedPrompts, getThinkingStates, getTypingDelay, waitForMinimumDuration } from "@/lib/chat-ui";
import AssistantMessageActions from "@/components/chat/AssistantMessageActions";
import PreChatComposer from "@/components/chat/PreChatComposer";
import { supabase } from "@/lib/supabase";
import CopilotResponseCard from "@/components/chat/CopilotResponseCard";
import AssistantMessageHeader from "@/components/chat/AssistantMessageHeader";
import ThinkingStateCard from "@/components/chat/ThinkingStateCard";
import {
  buildSupplierWelcomeReply,
  isGreetingOnlyMessage,
} from "@/lib/copilot-presets";
import type {
  ChatHistoryItem,
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

interface MoreActionItem {
  label: string;
  action?: string;
  href?: string;
}

const thinkingStates = getThinkingStates("supplier");
const suggestedPrompts = getSuggestedPrompts("supplier");
const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function formatMoney(amount: number): string {
  return amount ? `£${amount.toLocaleString()}` : "Pending rate";
}

function formatLoadStatus(status: string | null | undefined): string {
  const normalized = String(status || "active").toLowerCase();
  switch (normalized) {
    case "in-transit":
      return "In Transit";
    case "booked":
      return "Booked";
    case "completed":
      return "Completed";
    default:
      return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function buildStructuredText(reply: StructuredAssistantReply | undefined, fallback = ""): string {
  if (!reply) return fallback;
  return [
    reply.title,
    reply.shortExplanation,
    reply.nextStep ? `Next Step: ${reply.nextStep}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function enrichSupplierPlatformData(
  structuredReply: StructuredAssistantReply | undefined,
  prompt: string
): Promise<StructuredAssistantReply | undefined> {
  if (!structuredReply) {
    return structuredReply;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return structuredReply;
  }

  if (structuredReply.platformIntent?.type === "active_loads_lookup") {
    const { data, error } = await supabase
      .from("loads")
      .select("id,title,origin,destination,equipment,price,status,created_at")
      .eq("supplier_id", user.id)
      .in("status", ["active", "booked", "in-transit", "completed", "delivered"])
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data?.length) {
      return structuredReply;
    }

    return {
      ...structuredReply,
      platformResult: {
        title: "I pulled your latest loads from the platform.",
        subtitle: "Use these live statuses to track progress, review bids, or post the next shipment faster.",
        totalCount: data.length,
        loads: data.map((load) => ({
          id: String(load.id),
          title: `${(load.origin || "Pickup").split(",")[0]} -> ${(load.destination || "Delivery").split(",")[0]}`,
          subtitle: `${load.equipment || "General"} shipment now marked ${formatLoadStatus(load.status)}.`,
          metrics: [
            { label: "Status", value: formatLoadStatus(load.status) },
            { label: "Budget", value: formatMoney(Number(load.price || 0)) },
            { label: "Equipment", value: load.equipment || "Not set" },
            { label: "Action", value: "Track or review bids" },
          ],
          primaryAction: {
            label: "Track Load",
            href: "/supplier/my-posts",
            action: `Open tracking for load ${load.id}.`,
            variant: "primary",
          },
          secondaryActions: [
            {
              label: "View Bids",
              href: "/supplier/my-bids",
              action: `Show bids for load ${load.id}.`,
              variant: "secondary",
            },
            {
              label: "Find Carrier",
              action: `Find the best carrier for ${load.origin || "this load"} to ${load.destination || "destination"}.`,
              variant: "ghost",
            },
          ],
        })),
      },
    };
  }

  if (structuredReply.platformIntent?.type === "bids_lookup") {
    const { data: supplierLoads, error: loadsError } = await supabase
      .from("loads")
      .select("id,origin,destination,equipment")
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (loadsError || !supplierLoads?.length) {
      return structuredReply;
    }

    const loadIds = supplierLoads.map((load) => load.id);
    const loadMap = new Map(supplierLoads.map((load) => [String(load.id), load]));

    const { data: bids, error } = await supabase
      .from("bids")
      .select("id,load_id,amount,status,created_at")
      .in("load_id", loadIds)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !bids?.length) {
      return structuredReply;
    }

    return {
      ...structuredReply,
      platformResult: {
        title: "I found recent carrier bids on your posted loads.",
        subtitle: "Open bids to compare carriers and move the best load into booked status.",
        totalCount: bids.length,
        loads: bids.map((bid) => {
          const relatedLoad = loadMap.get(String(bid.load_id));
          return {
            id: String(bid.id),
            title: `${(relatedLoad?.origin || "Pickup").split(",")[0]} -> ${(relatedLoad?.destination || "Delivery").split(",")[0]}`,
            subtitle: `${relatedLoad?.equipment || "General"} load with a ${formatLoadStatus(bid.status)} bid.`,
            metrics: [
              { label: "Bid", value: formatMoney(Number(bid.amount || 0)) },
              { label: "Status", value: formatLoadStatus(bid.status) },
              { label: "Equipment", value: relatedLoad?.equipment || "Not set" },
              { label: "Next", value: "Review and accept best carrier" },
            ],
            primaryAction: {
              label: "View Bids",
              href: "/supplier/my-bids",
              action: `Open bid ${bid.id} for review.`,
              variant: "primary",
            },
            secondaryActions: [
              {
                label: "Track Load",
                href: "/supplier/my-posts",
                action: `Open load ${bid.load_id}.`,
                variant: "secondary",
              },
            ],
          };
        }),
      },
    };
  }

  if (structuredReply.platformIntent?.type === "earnings_lookup") {
    return {
      ...structuredReply,
      metrics: [
        ...(structuredReply.metrics || []),
        { label: "Saved Rate Checks", value: "Live pricing context", tone: "positive" },
      ],
    };
  }

  return structuredReply;
}

async function executeSupplierAction(
  structuredReply: StructuredAssistantReply | undefined
): Promise<{ structuredReply?: StructuredAssistantReply; message?: string }> {
  if (structuredReply?.actionRequest?.type !== "create_load" || structuredReply.actionRequest.status !== "ready") {
    return { structuredReply };
  }

  const payload = structuredReply.actionRequest.payload || {};
  const origin = String(payload.origin || "").trim();
  const destination = String(payload.destination || "").trim();
  const equipment = String(payload.equipment || "").trim();

  if (!origin || !destination || !equipment) {
    return { structuredReply };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { structuredReply };
  }

  const price = Number(payload.price || 0);
  const weight = String(payload.weight || "").trim();
  const { data, error } = await supabase
    .from("loads")
    .insert([
      {
        supplier_id: user.id,
        status: "active",
        title: `${equipment} load`,
        origin,
        destination,
        equipment,
        weight: weight || null,
        price: Number.isFinite(price) ? price : 0,
      },
    ])
    .select("id,origin,destination,equipment,price,status")
    .single();

  if (error || !data) {
    console.error("AI load creation failed:", error);
    return { structuredReply };
  }

  const completedReply: StructuredAssistantReply = {
    ...structuredReply,
    title: "Load created successfully",
    shortExplanation: `I created your ${equipment} load from ${origin} to ${destination} in the platform.`,
    keyPoints: [
      `Load ID: ${data.id}`,
      `Route: ${origin} -> ${destination}`,
      `Equipment: ${equipment}`,
      `Status: ${formatLoadStatus(data.status)}`,
    ],
    recommendation: "Review the best carrier options or incoming bids quickly so coverage can be confirmed faster.",
    nextStep: "Open My Posts or View Bids and choose the next action.",
    quickActions: [
      { label: "Track Load", href: "/supplier/my-posts", action: `Open load ${data.id}.`, variant: "primary" },
      { label: "View Bids", href: "/supplier/my-bids", action: `Review bids for load ${data.id}.`, variant: "secondary" },
      { label: "Post Load", href: "/supplier/post-load", action: "Create another load.", variant: "secondary" },
      { label: "Find Carrier", action: `Find the best carrier for ${origin} to ${destination}.`, variant: "ghost" },
      { label: "Calculate Profit", action: `Calculate pricing and margin for ${origin} to ${destination}.`, variant: "ghost" },
    ],
    actionRequest: {
      ...structuredReply.actionRequest,
      status: "completed",
      payload: { ...structuredReply.actionRequest.payload, loadId: String(data.id) },
      successMessage: "Load created in platform",
    },
    platformIntent: { type: "active_loads_lookup" },
    platformResult: {
      title: "New load is now live on the platform.",
      subtitle: "You can track it, review bids, or post another shipment.",
      totalCount: 1,
      loads: [
        {
          id: String(data.id),
          title: `${origin} -> ${destination}`,
          subtitle: `${equipment} load created by AI action engine.`,
          metrics: [
            { label: "Status", value: formatLoadStatus(data.status) },
            { label: "Budget", value: formatMoney(Number(data.price || 0)) },
            { label: "Equipment", value: equipment },
            { label: "Route", value: `${origin} -> ${destination}` },
          ],
          primaryAction: {
            label: "Track Load",
            href: "/supplier/my-posts",
            action: `Open load ${data.id}.`,
            variant: "primary",
          },
          secondaryActions: [
            {
              label: "View Bids",
              href: "/supplier/my-bids",
              action: `Review bids for load ${data.id}.`,
              variant: "secondary",
            },
          ],
        },
      ],
    },
    rawText: `Load created successfully.\n\nRoute: ${origin} -> ${destination}\nEquipment: ${equipment}\nStatus: ${formatLoadStatus(data.status)}\n\nNext Step: Open My Posts or View Bids.`,
  };

  return {
    structuredReply: completedReply,
    message: buildStructuredText(completedReply, structuredReply.rawText || ""),
  };
}

export default function SupplierAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, "up" | "down" | null>>({});
  const [moreMessageId, setMoreMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingHeading = `${greeting}${displayName ? `, ${displayName}` : ""}.`;

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    async function getProfileName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const rawName =
        profile?.full_name?.trim() ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "";

      const firstName = String(rawName).trim().split(/\s+/)[0] || "";
      setDisplayName(firstName);
    }

    getProfileName().catch((error) => {
      console.error("Error fetching display name:", error);
    });
  }, []);

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

  const supplierMoreActions: MoreActionItem[] = [
    { label: "Post Load", href: "/supplier/post-load" },
    { label: "View Bids", href: "/supplier/my-bids" },
    { label: "Track Shipments", href: "/supplier/my-posts" },
    { label: "Manage Loads", action: "Show my posted loads and what needs action." },
  ];

  const handleMoreAction = async (action: MoreActionItem) => {
    setMoreMessageId(null);

    if (action.href) {
      window.location.href = action.href;
      return;
    }

    if (action.action) {
      await handleSend(action.action);
    }
  };

  const handleQuickAction = async (action: CopilotQuickAction) => {
    if (action.action) {
      await handleSend(action.action);
    }
  };

  const handleEditUserMessage = (content: string) => {
    setInput(content);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(content.length, content.length);
    }, 0);
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

  const handleSend = async (text: string = input) => {
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
    if (!hasStarted) setHasStarted(true);

    if (isGreetingOnlyMessage(trimmedText)) {
      const structuredGreeting = buildSupplierWelcomeReply(displayName);
      const finalMessageText = buildStructuredText(structuredGreeting);
      const aiMessageId = (Date.now() + 1).toString();

      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      await streamAssistantReply(finalMessageText, aiMessageId, structuredGreeting);
      return;
    }

    setIsTyping(true);

    try {
      const aiResponse = await sendChatMessage(trimmedText, {
        assistantType: "supplier",
        history: buildHistory(nextMessages),
      });
      await waitForMinimumDuration(thinkingStartedAt);
      const aiMessageId = (Date.now() + 1).toString();
      setIsTyping(false);

      const enrichedReply = await enrichSupplierPlatformData(aiResponse.structuredMessage, trimmedText);
      const actionResult = await executeSupplierAction(enrichedReply);
      const finalStructuredReply = actionResult.structuredReply || enrichedReply;
      const finalMessageText = actionResult.message || buildStructuredText(finalStructuredReply, aiResponse.message);
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      await streamAssistantReply(finalMessageText, aiMessageId, finalStructuredReply);
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
      if (isGreetingOnlyMessage(prompt)) {
        const structuredGreeting = buildSupplierWelcomeReply(displayName);
        const finalMessageText = buildStructuredText(structuredGreeting);

        setIsTyping(false);
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? { ...message, content: "", structuredMessage: undefined, timestamp: getTimestamp() }
              : message
          )
        );
        await streamAssistantReply(finalMessageText, messageId, structuredGreeting);
        return;
      }

      const aiResponse = await sendChatMessage(prompt, {
        assistantType: "supplier",
        history,
      });

      await waitForMinimumDuration(thinkingStartedAt);
      setIsTyping(false);
      const enrichedReply = await enrichSupplierPlatformData(aiResponse.structuredMessage, prompt);
      const actionResult = await executeSupplierAction(enrichedReply);
      const finalStructuredReply = actionResult.structuredReply || enrichedReply;
      const finalMessageText = actionResult.message || buildStructuredText(finalStructuredReply, aiResponse.message);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, timestamp: getTimestamp() } : message
        )
      );
      await streamAssistantReply(finalMessageText, messageId, finalStructuredReply);
    } catch (error) {
      console.error("Regenerate failed:", error);
      setIsTyping(false);
      setStreamingMessageId(null);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, content: "Sorry, I encountered an error. Please try again later." }
            : message
        )
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#FDFDFD]">
      {/* Main Content */}
      <div className={`flex min-h-0 flex-1 flex-col ${hasStarted ? "" : "justify-center"}`}>
        {/* Welcome Screen - only when no chat started */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 flex-col items-center justify-center px-6"
            >
              <div className="mx-auto w-full max-w-5xl">
                <div className="mx-auto max-w-3xl text-center">
                  <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
                    {greetingHeading}
                  </h1>
                  <p className="mt-2 text-3xl font-semibold text-slate-400 sm:text-4xl">
                    How can I help you today?
                  </p>
                </div>

                <div className="mx-auto mt-8 max-w-3xl">
                  <PreChatComposer
                    value={input}
                    onChange={setInput}
                    onSend={() => handleSend(input)}
                    disabled={isTyping}
                    placeholder="Ask about posting a load, pricing, tracking, support..."
                    variant="blue"
                  />
                </div>

                <div className="mx-auto mt-4 flex max-w-3xl justify-center">
                  <button
                    type="button"
                    onClick={() => handleSend("Give me a quick step-by-step to post a load.")}
                    disabled={isTyping}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Quick generate
                  </button>
                </div>

                <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleSend("Help me post a new load. What details do you need from me?")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-blue-50 aspect-[4/3]">
                      <Image
                        src="/post-load-card.png"
                        alt="Post a load"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Post a load</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Pickup, delivery, cargo details, timing, and notes.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Estimate pricing for my load and explain what affects the rate.")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-amber-50 aspect-[4/3]">
                      <Image
                        src="/supplier-card-2.png"
                        alt="Pricing guidance"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Pricing guidance</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Rate drivers: distance, urgency, equipment, handling.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("How do I track my shipment and what statuses should I expect?")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-emerald-50 aspect-[4/3]">
                      <Image
                        src="/supplier-card-3.png"
                        alt="Track a shipment"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Track a shipment</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Pickup, in-transit updates, delivery confirmation, delays.
                    </p>
                  </button>
                </div>

                <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={isTyping}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages - only show when chat has started */}
        <AnimatePresence>
          {hasStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-slate-50/70 via-white to-slate-50/50 px-6 py-6"
            >
              <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                {messages.map((message, index) => (
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="max-w-[620px] sm:max-w-[680px]">
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
                          <div className="relative inline-block">
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
                              <div className="absolute bottom-full right-0 z-20 mb-2 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                                {supplierMoreActions.map((action) => (
                                  <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => handleMoreAction(action)}
                                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-[360px] sm:max-w-[420px]">
                        <div className="rounded-2xl rounded-br-md bg-slate-100 px-5 py-4 text-slate-900">
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-1 text-slate-500">
                          <button
                            type="button"
                            aria-label="Copy message"
                            title={copiedMessageId === message.id ? "Copied" : "Copy"}
                            onClick={() => handleCopy(message.id)}
                            className={`rounded-full p-1.5 transition ${
                              copiedMessageId === message.id
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-100 hover:text-slate-700"
                            }`}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Edit message"
                            title="Edit"
                            onClick={() => handleEditUserMessage(message.content)}
                            className="rounded-full p-1.5 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <PenLine className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {message.role === "user" && (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                        <User className="w-5 h-5 text-slate-700" />
                      </div>
                    )}
                  </motion.div>
                    );
                  })()
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <ThinkingStateCard states={thinkingStates} activeIndex={thinkingStep} />
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area - bottom when chat started */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div
            key="bottom-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 pb-12 pt-4"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                    placeholder="Ask your AI assistant anything..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400 shadow-md disabled:opacity-70"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex-shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
