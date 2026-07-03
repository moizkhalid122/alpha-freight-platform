"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, PenLine, Send, User, Sparkles, Route, Wallet } from "lucide-react";
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
  buildCarrierWelcomeReply,
  isGreetingOnlyMessage,
} from "@/lib/copilot-presets";
import type {
  ChatHistoryItem,
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

interface MoreActionItem {
  label: string;
  action?: string;
  href?: string;
}

const thinkingStates = getThinkingStates("carrier");
const suggestedPrompts = getSuggestedPrompts("carrier");
const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
import { MAPBOX_TOKEN } from "@/lib/mapbox";

function formatLoadStatus(status: string | null | undefined): string {
  const normalized = String(status || "active").toLowerCase();
  switch (normalized) {
    case "in-transit":
      return "In Transit";
    case "loading":
      return "Loading";
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

function getEquipmentMpg(equipment: string): number {
  const normalized = equipment.toLowerCase();
  if (normalized.includes("sprinter")) return 14;
  if (normalized.includes("box truck")) return 9;
  if (normalized.includes("reefer")) return 6;
  if (normalized.includes("flatbed")) return 6.4;
  if (normalized.includes("artic")) return 6.2;
  if (normalized.includes("dry van")) return 6.8;
  return 6.5;
}

async function geocodePlace(query: string): Promise<{ lng: number; lat: number } | null> {
  if (!query.trim()) return null;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();
    const center = data?.features?.[0]?.center;
    if (!Array.isArray(center) || center.length < 2) {
      return null;
    }

    return { lng: Number(center[0]), lat: Number(center[1]) };
  } catch {
    return null;
  }
}

async function getRouteMiles(origin: string, destination: string): Promise<number | null> {
  const [originCoords, destinationCoords] = await Promise.all([
    geocodePlace(origin),
    geocodePlace(destination),
  ]);

  if (!originCoords || !destinationCoords) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    const meters = data?.routes?.[0]?.distance;
    if (typeof meters !== "number") {
      return null;
    }

    return meters / 1609.34;
  } catch {
    return null;
  }
}

async function buildLoadProfitPrompt(
  action: CopilotQuickAction,
  sessionMemory: CopilotContextMemory | null
): Promise<string> {
  const origin = String(action.context?.origin || "").trim();
  const destination = String(action.context?.destination || "").trim();
  const equipment = String(action.context?.equipment || "General").trim();
  const status = String(action.context?.status || "active").trim();
  const rate = Number(action.context?.rate || 0);
  const currentLocation = String(sessionMemory?.userLocation || "").trim();

  const loadedMiles = await getRouteMiles(origin, destination);
  const deadheadMiles = currentLocation ? await getRouteMiles(currentLocation, origin) : null;
  const mpg = getEquipmentMpg(equipment);
  const fuelPricePerGallon = 4.2;
  const fuelCost =
    typeof loadedMiles === "number"
      ? ((loadedMiles + (deadheadMiles || 0)) / mpg) * fuelPricePerGallon
      : null;
  const rpm =
    typeof loadedMiles === "number" && loadedMiles > 0 && rate > 0
      ? rate / loadedMiles
      : null;

  return [
    "Analyze this exact load and calculate final profit estimate with full explanation.",
    `Route: ${origin} -> ${destination}`,
    `Status: ${status}`,
    `Equipment: ${equipment}`,
    typeof rate === "number" && rate > 0 ? `Rate: ${rate}` : "Rate: not available",
    typeof loadedMiles === "number" ? `Loaded miles: ${loadedMiles.toFixed(1)}` : "Loaded miles: not available",
    typeof deadheadMiles === "number" ? `Deadhead miles: ${deadheadMiles.toFixed(1)}` : "Deadhead miles: not available",
    typeof fuelCost === "number"
      ? `Fuel cost: ${fuelCost.toFixed(2)}`
      : "Fuel cost: not available",
    typeof rpm === "number" ? `RPM: ${rpm.toFixed(2)}` : "RPM: not available",
    typeof deadheadMiles === "number"
      ? "Use the full trip inputs including deadhead in the estimate."
      : "If deadhead is missing, clearly say this estimate is based on the loaded route only.",
    "Show complete load details first, then explain rate, miles, fuel cost, estimated final profit, and why the profit is this amount.",
  ].join("\n");
}

function scoreCarrierLoad(load: any, structuredReply: StructuredAssistantReply, prompt: string): number {
  let score = 72;
  const equipmentHint = String(
    structuredReply.platformIntent?.equipmentType ||
      structuredReply.memory?.equipmentType ||
      structuredReply.memory?.truckType ||
      ""
  ).toLowerCase();
  const locationHint = String(
    structuredReply.platformIntent?.location ||
      structuredReply.memory?.userLocation ||
      ""
  ).toLowerCase();
  const routeHint = String(structuredReply.platformIntent?.route || "").toLowerCase();
  const pickup = String(load.pickup_location || load.origin || "").toLowerCase();
  const delivery = String(load.delivery_location || load.destination || "").toLowerCase();
  const equipment = String(load.equipment || load.vehicle_type || "").toLowerCase();
  const price = Number(load.price || load.max_budget || 0);
  const promptNormalized = prompt.toLowerCase();

  if (equipmentHint && equipment.includes(equipmentHint)) score += 12;
  if (locationHint && pickup.includes(locationHint)) score += 10;
  if (routeHint && `${pickup} ${delivery}`.includes(routeHint)) score += 8;
  if (promptNormalized.includes("highest paying") || promptNormalized.includes("best load")) {
    score += Math.min(10, Math.round(price / 250));
  }

  return Math.min(score, 99);
}

function buildCarrierLoadReasons(load: any, structuredReply: StructuredAssistantReply, prompt: string): string[] {
  const reasons: string[] = [];
  const equipmentHint = String(
    structuredReply.platformIntent?.equipmentType ||
      structuredReply.memory?.equipmentType ||
      structuredReply.memory?.truckType ||
      ""
  ).toLowerCase();
  const locationHint = String(
    structuredReply.platformIntent?.location ||
      structuredReply.memory?.userLocation ||
      ""
  ).toLowerCase();
  const routeHint = String(structuredReply.platformIntent?.route || "").toLowerCase();
  const pickup = String(load.pickup_location || load.origin || "").toLowerCase();
  const delivery = String(load.delivery_location || load.destination || "").toLowerCase();
  const equipment = String(load.equipment || load.vehicle_type || "").toLowerCase();
  const price = Number(load.price || load.max_budget || 0);
  const promptNormalized = prompt.toLowerCase();

  if (equipmentHint && equipment.includes(equipmentHint)) {
    reasons.push(`equipment fits your ${equipmentHint} preference`);
  }

  if (locationHint && pickup.includes(locationHint)) {
    reasons.push(`pickup looks close to ${structuredReply.platformIntent?.location || structuredReply.memory?.userLocation}`);
  }

  if (routeHint && `${pickup} ${delivery}`.includes(routeHint)) {
    reasons.push("route matches your preferred lane");
  }

  if (price > 0 && (promptNormalized.includes("highest paying") || promptNormalized.includes("best load"))) {
    reasons.push(`strong payout at ${priceToDisplay(load)}`);
  }

  if (!reasons.length && price > 0) {
    reasons.push(`good rate signal at ${priceToDisplay(load)}`);
  }

  if (!reasons.length) {
    reasons.push("good overall fit based on current load search signals");
  }

  return reasons.slice(0, 3);
}

async function enrichCarrierPlatformData(
  structuredReply: StructuredAssistantReply | undefined,
  prompt: string
): Promise<StructuredAssistantReply | undefined> {
  if (!structuredReply) {
    return structuredReply;
  }

  if (structuredReply.platformIntent?.type === "active_loads_lookup") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return structuredReply;
    }

    const { data, error } = await supabase
      .from("loads")
      .select("id,pickup_location,delivery_location,origin,destination,equipment,vehicle_type,price,max_budget,created_at,status")
      .eq("carrier_id", user.id)
      .in("status", ["active", "booked", "loading", "in-transit", "completed", "delivered"])
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data?.length) {
      return structuredReply;
    }

    return {
      ...structuredReply,
      platformResult: {
        title: "I pulled your current loads from the platform.",
        subtitle: "These live jobs are ready for tracking, payout review, and next dispatch decisions.",
        totalCount: data.length,
        loads: data.map((load) => ({
          id: String(load.id),
          title: `${(load.pickup_location || load.origin || "Pickup").split(",")[0]} -> ${(load.delivery_location || load.destination || "Delivery").split(",")[0]}`,
          subtitle: `${load.equipment || load.vehicle_type || "General"} load now marked ${formatLoadStatus(load.status)}.`,
          metrics: [
            { label: "Status", value: formatLoadStatus(load.status) },
            { label: "Rate", value: priceToDisplay(load) },
            { label: "Equipment", value: load.equipment || load.vehicle_type || "General" },
            { label: "Next", value: "Track, deliver, or review payout" },
          ],
          primaryAction: {
            label: "Track Load",
            href: "/carrier/my-loads",
            action: `Open load ${load.id}.`,
            variant: "primary",
          },
          secondaryActions: [
            {
              label: "View Bids",
              href: "/carrier/my-bids",
              action: "Review my bid status.",
              variant: "secondary",
            },
            {
              label: "Calculate Profit",
              action: `Calculate profit for ${(load.pickup_location || load.origin || "this pickup").split(",")[0]} to ${(load.delivery_location || load.destination || "this delivery").split(",")[0]}.`,
              variant: "ghost",
              context: {
                origin: load.pickup_location || load.origin || "",
                destination: load.delivery_location || load.destination || "",
                equipment: load.equipment || load.vehicle_type || "General",
                status: load.status || "active",
                rate: Number(load.price || load.max_budget || 0),
              },
            },
          ],
        })),
      },
    };
  }

  if (structuredReply.platformIntent?.type !== "loads_search") {
    return structuredReply;
  }

  const { data, error } = await supabase
    .from("loads")
    .select("id,pickup_location,delivery_location,origin,destination,equipment,vehicle_type,price,max_budget,created_at,status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error || !data?.length) {
    return structuredReply;
  }

  const rankedLoads = [...data]
    .map((load) => ({
      load,
      score: scoreCarrierLoad(load, structuredReply, prompt),
    }))
    .sort((left, right) => right.score - left.score);

  const topLoads = rankedLoads.slice(0, 3);
  const bestLoad = topLoads[0];
  const bestLoadPickup = (bestLoad?.load.pickup_location || bestLoad?.load.origin || "Pickup").split(",")[0];
  const bestLoadDelivery = (bestLoad?.load.delivery_location || bestLoad?.load.destination || "Delivery").split(",")[0];
  const bestLoadReasons = bestLoad ? buildCarrierLoadReasons(bestLoad.load, structuredReply, prompt) : [];

  return {
    ...structuredReply,
    title: bestLoad
      ? `Best Load Right Now: ${bestLoadPickup} -> ${bestLoadDelivery}`
      : "I found matching loads in the platform.",
    shortExplanation: bestLoad
      ? `I ranked the live loads and this is the strongest option right now because ${bestLoadReasons.join(", ")}.`
      : structuredReply.shortExplanation,
    recommendation: bestLoad
      ? `Start with ${bestLoadPickup} -> ${bestLoadDelivery}, then compare the next two loads only if you want a better RPM, closer pickup, or stronger backhaul potential.`
      : structuredReply.recommendation,
    nextStep: bestLoad
      ? "Open the top load below, review the rate and pickup timing, then bid or calculate profit."
      : structuredReply.nextStep,
    keyPoints: bestLoad
      ? [
          `Best overall load: ${bestLoadPickup} -> ${bestLoadDelivery}.`,
          ...bestLoadReasons.map((reason) => reason.charAt(0).toUpperCase() + reason.slice(1) + "."),
          "I also ranked the next best options below so you can compare before bidding.",
        ]
      : structuredReply.keyPoints,
    platformResult: {
      title: bestLoad
        ? `Top ranked loads with ${bestLoadPickup} -> ${bestLoadDelivery} in the lead.`
        : "I found matching loads in the platform.",
      subtitle: "Best options ranked by equipment fit, pickup proximity, and payout potential.",
      totalCount: rankedLoads.length,
      loads: topLoads.map(({ load, score }) => ({
        id: String(load.id),
        title: `${(load.pickup_location || load.origin || "Pickup").split(",")[0]} -> ${(load.delivery_location || load.destination || "Delivery").split(",")[0]}`,
        subtitle: `${load.equipment || load.vehicle_type || "General"} load with active bidding/book flow.`,
        score,
        metrics: [
          { label: "Profitability", value: score >= 90 ? "High" : score >= 82 ? "Good" : "Moderate" },
          { label: "RPM", value: priceToDisplay(load) },
          { label: "Deadhead", value: structuredReply.memory?.userLocation ? "Low if pickup is nearby" : "Need exact location" },
          { label: "Fuel Cost", value: "Use route map for exact estimate" },
        ],
        primaryAction: {
          label: "View Load",
          href: "/carrier/available-loads",
          action: "Open the matching load in the platform.",
          variant: "primary",
        },
        secondaryActions: [
          {
            label: "Bid Now",
            href: "/carrier/available-loads",
            action: "Open bidding for this matching load.",
            variant: "secondary",
          },
          {
            label: "Save",
            action: `Save a lane preference for ${(load.pickup_location || load.origin || "this pickup").split(",")[0]} to ${(load.delivery_location || load.destination || "this delivery").split(",")[0]}.`,
            variant: "ghost",
          },
          {
            label: "Calculate Profit",
            action: `Calculate profit for ${(load.pickup_location || load.origin || "this pickup").split(",")[0]} to ${(load.delivery_location || load.destination || "this delivery").split(",")[0]}.`,
            variant: "ghost",
            context: {
              origin: load.pickup_location || load.origin || "",
              destination: load.delivery_location || load.destination || "",
              equipment: load.equipment || load.vehicle_type || "General",
              status: load.status || "active",
              rate: Number(load.price || load.max_budget || 0),
            },
          },
        ],
      })),
    },
  };
}

function priceToDisplay(load: any): string {
  const amount = Number(load.price || load.max_budget || 0);
  return amount ? `£${amount.toLocaleString()}` : "Request exact rate";
}

export default function CarrierAIAssistant() {
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
  const [sessionMemory, setSessionMemory] = useState<CopilotContextMemory | null>(null);

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

  const carrierMoreActions: MoreActionItem[] = [
    { label: "Find Loads", href: "/carrier/available-loads" },
    { label: "Track Loads", href: "/carrier/my-loads" },
    { label: "View Bids", href: "/carrier/my-bids" },
    { label: "Improve Earnings", action: "Help me improve earnings, RPM, and route quality." },
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
    if (action.label === "Calculate Profit" && action.context) {
      const prompt = await buildLoadProfitPrompt(action, sessionMemory);
      await handleSend(prompt);
      return;
    }

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
      const structuredGreeting = buildCarrierWelcomeReply(displayName);
      const finalMessageText = buildStructuredText(structuredGreeting);
      const aiMessageId = (Date.now() + 1).toString();

      if (structuredGreeting.memory) {
        setSessionMemory(structuredGreeting.memory);
      }

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
        assistantType: "carrier",
        history: buildHistory(nextMessages),
      });
      await waitForMinimumDuration(thinkingStartedAt);
      const aiMessageId = (Date.now() + 1).toString();
      setIsTyping(false);

      const enrichedStructuredReply = await enrichCarrierPlatformData(
        aiResponse.structuredMessage,
        trimmedText
      );
      const finalMessageText = buildStructuredText(enrichedStructuredReply, aiResponse.message);
      if (enrichedStructuredReply?.memory) {
        setSessionMemory(enrichedStructuredReply.memory);
      }

      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      await streamAssistantReply(finalMessageText, aiMessageId, enrichedStructuredReply);
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
        const structuredGreeting = buildCarrierWelcomeReply(displayName);
        const finalMessageText = buildStructuredText(structuredGreeting);

        setIsTyping(false);
        if (structuredGreeting.memory) {
          setSessionMemory(structuredGreeting.memory);
        }

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
        assistantType: "carrier",
        history,
      });

      await waitForMinimumDuration(thinkingStartedAt);
      setIsTyping(false);
      const enrichedStructuredReply = await enrichCarrierPlatformData(
        aiResponse.structuredMessage,
        prompt
      );
      const finalMessageText = buildStructuredText(enrichedStructuredReply, aiResponse.message);
      if (enrichedStructuredReply?.memory) {
        setSessionMemory(enrichedStructuredReply.memory);
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, timestamp: getTimestamp() } : message
        )
      );
      await streamAssistantReply(finalMessageText, messageId, enrichedStructuredReply);
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
    <div className="flex min-h-screen flex-col bg-[#FDFDFD]">
      {/* Header - only show when chat has started */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-gray-100 bg-white/90 px-6 py-5 backdrop-blur"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 relative overflow-hidden">
                <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-2" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  AI Assistant
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    Beta
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Your 24/7 logistics helper
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
        <div className={`flex-1 flex flex-col ${hasStarted ? "" : "justify-center"}`}>
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
                    placeholder="Ask about loads, routes, payout, verification..."
                    variant="emerald"
                  />
                </div>

                <div className="mx-auto mt-4 flex max-w-3xl justify-center">
                  <button
                    type="button"
                    onClick={() => handleSend("Give me quick tips to find the best loads today.")}
                    disabled={isTyping}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Quick generate
                  </button>
                </div>

                <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleSend("Show me the best loads near me and what to prioritize.")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-emerald-50 aspect-[4/3]">
                      <Image
                        src="/carrier-card-1.png"
                        alt="Find better loads"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Find better loads</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Matching tips, route fit, timing, and earnings potential.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Help me plan my route and reduce empty miles.")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-indigo-50 aspect-[4/3]">
                      <Image
                        src="/carrier-card-2.png"
                        alt="Plan a route"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Plan a route</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Backhaul strategy, delivery windows, and smart stops.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend("Explain payout timing and how to maximize earnings.")}
                    disabled={isTyping}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl bg-amber-50 aspect-[4/3]">
                      <Image
                        src="/carrier-card-3.png"
                        alt="Earnings and payout"
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Earnings & payout</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Payout schedule, invoices, and performance improvements.
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
                                {carrierMoreActions.map((action) => (
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
