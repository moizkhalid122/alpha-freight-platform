import { buildAiAssistantReply, type AiAssistantReply } from "@/lib/ai-assistant-responses";
import type { AiCarrierContext } from "@/lib/ai-carrier-context";
import { getAiApiBaseUrl } from "@/lib/ai-api-config";
import { supabase } from "@/lib/supabase";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type StructuredAssistantReply = {
  displayStyle?: "plain" | "card";
  title?: string;
  shortExplanation?: string;
  keyPoints?: string[];
  recommendation?: string;
  nextStep?: string;
  rawText?: string;
  knowledgeSource?: string;
};

type ChatApiResponse = {
  success?: boolean;
  message?: string;
  structuredMessage?: StructuredAssistantReply;
  error?: string;
};

export type SendAiChatOptions = {
  assistantType?: "carrier" | "supplier" | "general";
  history?: ChatHistoryItem[];
  carrierContext?: AiCarrierContext | null;
  signal?: AbortSignal;
};

export type AiChatStreamCallbacks = {
  onPhase?: (phase: "thinking" | "searching") => void;
  onDelta?: (text: string) => void;
};

const REQUEST_TIMEOUT_MS = 55000;

async function buildAiRequestHeaders(accept: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: accept,
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Session unavailable — backend may reject if auth is required.
  }

  return headers;
}

function authFailureReply(message: string): AiAssistantReply {
  return {
    title: "Login required",
    sectionLabel: message,
    footer: "Please sign in again, then reopen AI assistant.",
  };
}

function offlineReply(message: string, userPrompt: string): AiAssistantReply {
  return {
    ...buildAiAssistantReply(userPrompt),
    footer: message,
  };
}

function withTimeoutSignal(parent?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const abortFromParent = () => controller.abort();
  parent?.addEventListener("abort", abortFromParent);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      parent?.removeEventListener("abort", abortFromParent);
    },
  };
}

export function mapStructuredReply(
  structured?: StructuredAssistantReply,
  fallbackMessage?: string
): AiAssistantReply {
  if (!structured) {
    const lines = (fallbackMessage || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      title: lines[0] || "Alpha Freight Co-Pilot",
      bullets: lines.slice(1),
    };
  }

  const plainBody = (structured.rawText || structured.shortExplanation || fallbackMessage || "").trim();
  const plainLines = plainBody
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const keyPoints = (structured.keyPoints || []).map((point) => point.trim()).filter(Boolean);
  const sectionText = (structured.shortExplanation || "").trim();

  const dedupedKeyPoints = keyPoints.filter((point) => {
    if (!sectionText) return true;
    if (point === sectionText) return false;
    if (sectionText.includes(point) && point.length > 50) return false;
    return true;
  });

  const bulletsFromStructured = [
    ...dedupedKeyPoints,
    structured.recommendation ? `Recommendation: ${structured.recommendation}` : "",
  ].filter(Boolean);

  if (structured.knowledgeSource === "web_search") {
    return {
      title: structured.title || "Alpha Freight Co-Pilot",
      sectionLabel: sectionText || undefined,
      bullets: [],
      footer: structured.nextStep || "Updated from live web search",
    };
  }

  if (structured.displayStyle === "plain") {
    const bulletsDuplicateSection =
      Boolean(sectionText) &&
      bulletsFromStructured.length > 0 &&
      bulletsFromStructured.every(
        (bullet) => bullet === sectionText || sectionText.includes(bullet)
      );

    return {
      title: structured.title || plainLines[0] || "Alpha Freight Co-Pilot",
      sectionLabel: sectionText || undefined,
      bullets: bulletsDuplicateSection
        ? []
        : bulletsFromStructured.length
          ? bulletsFromStructured
          : plainLines.slice(1),
      footer: structured.nextStep || undefined,
    };
  }

  return {
    title: structured.title || "Alpha Freight Co-Pilot",
    sectionLabel: structured.shortExplanation || undefined,
    bullets: bulletsFromStructured.length ? bulletsFromStructured : plainLines.slice(1),
    footer:
      structured.nextStep ||
      (structured.knowledgeSource === "web_search" ? "Updated from live web search" : undefined),
  };
}

export function buildChatHistory(
  messages: Array<{
    role: "user" | "assistant";
    text: string;
    title?: string;
    sectionLabel?: string;
    bullets?: string[];
    footer?: string;
  }>
): ChatHistoryItem[] {
  return messages.slice(-18).map((message) => {
    if (message.role === "user") {
      return { role: "user", content: message.text };
    }

    const content = [
      message.title,
      message.sectionLabel,
      ...(message.bullets || []),
      message.footer,
    ]
      .filter(Boolean)
      .join("\n");

    return { role: "assistant", content: content || message.text };
  });
}

type StreamEvent =
  | { type: "phase"; phase: "thinking" | "searching" }
  | { type: "delta"; text: string }
  | {
      type: "complete";
      success?: boolean;
      message?: string;
      structuredMessage?: StructuredAssistantReply;
      error?: string;
    };

function consumeNdjsonBuffer(buffer: string, onEvent: (event: StreamEvent) => void) {
  const parts = buffer.split("\n");
  const remainder = parts.pop() || "";

  parts.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      onEvent(JSON.parse(trimmed) as StreamEvent);
    } catch {
      // Ignore partial JSON fragments until the next chunk arrives.
    }
  });

  return remainder;
}

export async function sendAiChatMessageStream(
  message: string,
  options: SendAiChatOptions & AiChatStreamCallbacks = {}
) {
  const {
    assistantType = "carrier",
    history = [],
    carrierContext = null,
    signal,
    onPhase,
    onDelta,
  } = options;
  const timeout = withTimeoutSignal(signal);

  try {
    const headers = await buildAiRequestHeaders("application/x-ndjson");

    return await new Promise<AiAssistantReply>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastIndex = 0;
      let ndjsonBuffer = "";
      let resolved = false;

      const finish = (reply: AiAssistantReply) => {
        if (resolved) return;
        resolved = true;
        timeout.cleanup();
        resolve(reply);
      };

      const fail = (error: Error) => {
        if (resolved) return;
        resolved = true;
        timeout.cleanup();
        reject(error);
      };

      const handleEvent = (event: StreamEvent) => {
        if (event.type === "phase" && event.phase) {
          onPhase?.(event.phase);
        }

        if (event.type === "delta" && event.text) {
          onDelta?.(event.text);
        }

        if (event.type === "complete") {
          if (event.success === false) {
            fail(new Error(event.error || event.message || "AI stream failed"));
            return;
          }

          finish(mapStructuredReply(event.structuredMessage, event.message));
        }
      };

      xhr.open("POST", `${getAiApiBaseUrl()}/api/chat`);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.onprogress = () => {
        const chunk = xhr.responseText.slice(lastIndex);
        lastIndex = xhr.responseText.length;
        if (!chunk) return;

        ndjsonBuffer += chunk;
        ndjsonBuffer = consumeNdjsonBuffer(ndjsonBuffer, handleEvent);
      };

      xhr.onload = () => {
        if (resolved) return;

        if (xhr.status === 401) {
          finish(authFailureReply("Your session expired. Please log in again."));
          return;
        }

        if (xhr.status === 429) {
          finish(
            authFailureReply("Too many AI requests. Please wait a minute and try again.")
          );
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          ndjsonBuffer = consumeNdjsonBuffer(`${ndjsonBuffer}\n`, handleEvent);

          if (!resolved) {
            fail(new Error("AI stream ended without a complete reply"));
          }
          return;
        }

        fail(new Error(`AI stream failed (${xhr.status})`));
      };

      xhr.onerror = () => {
        const error = new Error("AI stream network error");
        error.name = "NetworkError";
        fail(error);
      };

      xhr.onabort = () => {
        const error = new Error("AbortError");
        error.name = "AbortError";
        fail(error);
      };

      if (timeout.signal.aborted) {
        xhr.abort();
        return;
      }

      timeout.signal.addEventListener("abort", () => xhr.abort(), { once: true });

      xhr.send(
        JSON.stringify({
          message,
          assistantType,
          history,
          carrierContext,
          stream: true,
        })
      );
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return offlineReply(
        "AI server is taking longer than usual. Showing a quick offline guide — try again in a moment.",
        message
      );
    }

    return sendAiChatMessage(message, options);
  }
}

export async function sendAiChatMessage(message: string, options: SendAiChatOptions = {}) {
  const { assistantType = "carrier", history = [], carrierContext = null, signal } = options;
  const timeout = withTimeoutSignal(signal);

  try {
    const headers = await buildAiRequestHeaders("application/json");
    const response = await fetch(`${getAiApiBaseUrl()}/api/chat`, {
      method: "POST",
      headers,
      signal: timeout.signal,
      body: JSON.stringify({
        message,
        assistantType,
        history,
        carrierContext,
      }),
    });

    const data = (await response.json()) as ChatApiResponse;

    if (response.status === 401) {
      return authFailureReply(data.message || "Login required to use AI assistant.");
    }

    if (response.status === 429) {
      return authFailureReply(data.message || "Too many AI requests. Please wait and try again.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.message || "AI request failed");
    }

    return mapStructuredReply(data.structuredMessage, data.message);
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    if (isTimeout) {
      return offlineReply(
        "AI server is taking longer than usual. Showing a quick offline guide — try again in a moment.",
        message
      );
    }

    return offlineReply(
      "Live AI is offline right now. Check your connection or try again shortly.",
      message
    );
  } finally {
    timeout.cleanup();
  }
}
