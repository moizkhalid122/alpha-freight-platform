import type { ChatApiResponse, SendChatMessageOptions } from "@/lib/chat-types";
import { supabase } from "@/lib/supabase";

async function buildChatHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export type ChatApiExtendedResponse = ChatApiResponse & {
  source?: string;
  conversationId?: string;
  alerts?: Array<{ id: string; title: string; message: string; action?: string }>;
  remaining?: number;
  limitReached?: boolean;
};

export async function sendChatMessage(
  message: string,
  options: SendChatMessageOptions & {
    language?: string;
    conversationId?: string;
    confirmAction?: boolean;
  } = {}
): Promise<ChatApiExtendedResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const headers = await buildChatHeaders();
    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        message,
        assistantType: options.assistantType || "general",
        mode: options.mode,
        history: options.history || [],
        language: options.language,
        conversationId: options.conversationId,
        confirmAction: options.confirmAction,
        publicMode: options.publicMode,
      }),
    });

    if (response.status === 401) {
      return { message: "Please log in again to use AI assistant." };
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.limitReached) {
        return {
          message: data.message,
          structuredMessage: data.structuredMessage,
          limitReached: true,
          remaining: 0,
        };
      }
      throw new Error("Failed to send message");
    }

    const data = await response.json();

    if (data.limitReached) {
      return {
        message: data.message,
        structuredMessage: data.structuredMessage,
        limitReached: true,
        remaining: 0,
      };
    }

    return {
      message: data.message,
      structuredMessage: data.structuredMessage,
      source: data.source,
      conversationId: data.conversationId,
      alerts: data.alerts,
      remaining: data.remaining,
    };
  } catch (error) {
    console.error("Error sending chat message:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return {
        message:
          "Sorry, AI thori slow chal rahi ha. Dobara try karein ya apna sawal thora short bhejein.",
      };
    }

    return {
      message: "Sorry, I encountered an error. Please try again later.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function saveChatFeedback(options: {
  messageId: string;
  feedback: "up" | "down";
  assistantType: string;
  query?: string;
  replyTitle?: string;
}) {
  const headers = await buildChatHeaders();
  await fetch("/api/chat/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify(options),
  });
}

export async function loadChatHistory(conversationId: string) {
  const headers = await buildChatHeaders();
  const res = await fetch("/api/chat/history", {
    method: "POST",
    headers,
    body: JSON.stringify({ conversationId }),
  });
  const data = await res.json();
  return data.messages || [];
}

export async function createNewConversation(assistantType: string) {
  const headers = await buildChatHeaders();
  const res = await fetch("/api/chat/history", {
    method: "POST",
    headers,
    body: JSON.stringify({ assistantType }),
  });
  const data = await res.json();
  return data.conversationId as string | undefined;
}
