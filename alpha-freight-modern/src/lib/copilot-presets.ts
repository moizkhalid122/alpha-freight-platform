"use client";

import type { CopilotMode, StructuredAssistantReply } from "@/lib/chat-types";

const COPILOT_MODE_LABELS: Record<CopilotMode, string> = {
  logistics_copilot: "Logistics Copilot",
  tracking_assistant: "Tracking Assistant",
  load_analyst: "Load Analyst",
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
};

function buildDisplayName(displayName?: string): string {
  const trimmed = String(displayName || "").trim();
  return trimmed ? `, ${trimmed}` : "";
}

export function getCopilotModeLabel(mode?: string | null): string {
  if (!mode) return COPILOT_MODE_LABELS.logistics_copilot;
  return COPILOT_MODE_LABELS[mode as CopilotMode] || COPILOT_MODE_LABELS.logistics_copilot;
}

export function isGreetingOnlyMessage(message: string): boolean {
  const normalized = String(message || "").trim().toLowerCase();
  return /^(hi|hello|hey|hi there|hello there|hey there|salam|slam|assalam o alaikum|aoa)[.!?]*$/.test(normalized);
}

export function buildCarrierWelcomeReply(displayName?: string): StructuredAssistantReply {
  return {
    mode: "logistics_copilot",
    displayStyle: "card",
    userIntent: "Casual Conversation",
    responseLength: "medium",
    modeLabel: COPILOT_MODE_LABELS.logistics_copilot,
    assistantName: "Alpha Freight Copilot",
    confidence: 99,
    knowledgeSource: "Role-aware welcome flow",
    title: `Welcome back${buildDisplayName(displayName)}.`,
    shortExplanation: "I can help you with:",
    keyPoints: [
      "Find high-paying loads",
      "Reduce deadhead miles",
      "Improve earnings and RPM",
      "Track active shipments",
      "Manage bids",
    ],
    recommendation: "Choose a quick action below or type your current priority.",
    nextStep: "What would you like help with today?",
    metrics: [],
    sections: [],
    quickActions: [
      {
        label: "Find Loads",
        href: "/carrier/available-loads",
        action: "Find high-paying loads near my current area.",
        variant: "primary",
      },
      {
        label: "My Bids",
        href: "/carrier/my-bids",
        action: "Show my active bids and what needs attention.",
        variant: "secondary",
      },
      {
        label: "Track Shipment",
        href: "/carrier/my-loads",
        action: "Track my active shipments and show status updates.",
        variant: "secondary",
      },
      {
        label: "Improve Earnings",
        action: "Help me improve earnings, RPM, and route quality.",
        variant: "ghost",
      },
    ],
    suggestedQuestions: [
      "Find loads near Dallas",
      "Show my active bids",
      "How can I reduce deadhead miles?",
    ],
    actionRequest: null,
    memory: {
      role: "carrier",
      persona: "Carrier Operations Copilot",
    },
    rawText: "",
  };
}

export function buildSupplierWelcomeReply(displayName?: string): StructuredAssistantReply {
  return {
    mode: "logistics_copilot",
    displayStyle: "card",
    userIntent: "Casual Conversation",
    responseLength: "medium",
    modeLabel: COPILOT_MODE_LABELS.logistics_copilot,
    assistantName: "Alpha Freight Copilot",
    confidence: 99,
    knowledgeSource: "Role-aware welcome flow",
    title: `Welcome back${buildDisplayName(displayName)}.`,
    shortExplanation: "I can help you with:",
    keyPoints: [
      "Post a new load",
      "Review carrier bids",
      "Manage shipments",
      "Track deliveries",
      "Reduce transportation costs",
    ],
    recommendation: "Choose a quick action below or type your shipment task directly.",
    nextStep: "What would you like to do today?",
    metrics: [],
    sections: [],
    quickActions: [
      {
        label: "Post Load",
        href: "/supplier/post-load",
        action: "Help me post a new load step by step.",
        variant: "primary",
      },
      {
        label: "View Bids",
        href: "/supplier/my-bids",
        action: "Show my latest carrier bids and what to review first.",
        variant: "secondary",
      },
      {
        label: "Track Shipment",
        href: "/supplier/my-posts",
        action: "Track my current shipments and delivery progress.",
        variant: "secondary",
      },
      {
        label: "Manage Loads",
        href: "/supplier/my-posts",
        action: "Show my posted loads and what needs action.",
        variant: "ghost",
      },
    ],
    suggestedQuestions: [
      "Help me post a load",
      "Show my latest bids",
      "Track my active shipment",
    ],
    actionRequest: null,
    memory: {
      role: "supplier",
      persona: "Supplier Operations Copilot",
    },
    rawText: "",
  };
}
