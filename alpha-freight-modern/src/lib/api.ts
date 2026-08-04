import type { AssistantKind, ChatApiResponse, SendChatMessageOptions, StructuredAssistantReply } from "@/lib/chat-types";
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

export type PublicChatStreamCallbacks = {
  onToken?: (delta: string, fullText: string) => void;
  onDone?: (result: ChatApiExtendedResponse) => void;
  onError?: (message: string) => void;
  onLimit?: (result: ChatApiExtendedResponse) => void;
};

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    if (line.startsWith("data: ")) dataLines.push(line.slice(6));
  }

  if (!dataLines.length) return null;
  return { event, data: dataLines.join("\n") };
}

export async function streamPublicChatMessage(
  message: string,
  options: {
    history?: SendChatMessageOptions["history"];
    language?: string;
    sessionMemory?: SendChatMessageOptions["sessionMemory"];
    assistantType?: AssistantKind;
  } = {},
  callbacks: PublicChatStreamCallbacks = {}
): Promise<ChatApiExtendedResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const headers = await buildChatHeaders();
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        message,
        history: options.history || [],
        language: options.language,
        sessionMemory: options.sessionMemory,
        assistantType: options.assistantType || "general",
      }),
    });

    if (!response.ok) {
      throw new Error("Stream request failed");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream body");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let finalResult: ChatApiExtendedResponse = { message: "" };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        const parsed = parseSseBlock(block.trim());
        if (!parsed) continue;

        const payload = JSON.parse(parsed.data) as Record<string, unknown>;

        if (parsed.event === "token") {
          const delta = String(payload.delta || "");
          fullText += delta;
          callbacks.onToken?.(delta, fullText);
        }

        if (parsed.event === "limit") {
          finalResult = {
            message: String(payload.message || ""),
            structuredMessage: payload.structuredMessage as StructuredAssistantReply | undefined,
            limitReached: true,
            remaining: 0,
          };
          callbacks.onLimit?.(finalResult);
          return finalResult;
        }

        if (parsed.event === "done") {
          finalResult = {
            message: String(payload.message || fullText),
            structuredMessage: payload.structuredMessage as StructuredAssistantReply | undefined,
            source: String(payload.source || "openai"),
            remaining: typeof payload.remaining === "number" ? payload.remaining : undefined,
          };
          callbacks.onDone?.(finalResult);
        }

        if (parsed.event === "error") {
          const errMsg = String(payload.message || "Stream error");
          callbacks.onError?.(errMsg);
          finalResult = { message: errMsg };
        }
      }
    }

    if (!finalResult.message && fullText) {
      finalResult = { message: fullText };
    }

    return finalResult.message ? finalResult : { message: "Sorry, no response received." };
  } catch (error) {
    console.error("Error streaming chat message:", error);
    const errMsg =
      error instanceof Error && error.name === "AbortError"
        ? "Sorry, the response took too long. Please try again."
        : "Sorry, I encountered an error. Please try again later.";
    callbacks.onError?.(errMsg);
    return { message: errMsg };
  } finally {
    clearTimeout(timeoutId);
  }
}
