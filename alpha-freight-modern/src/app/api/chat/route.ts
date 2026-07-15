import { NextRequest, NextResponse } from "next/server";
import { getMarketingChatReply } from "@/lib/marketing-chat";

export const runtime = "nodejs";

function resolveBackendUrls(): string[] {
  const candidates = [
    process.env.AI_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3003" : null,
    process.env.NODE_ENV !== "production" ? "http://localhost:3003" : null,
  ]
    .filter(Boolean)
    .map((value) => value!.replace(/\/$/, ""));

  return [...new Set(candidates)];
}

async function proxyToBackend(
  request: NextRequest,
  body: Record<string, unknown>
): Promise<{ message: string; structuredMessage?: unknown } | null> {
  const authHeader = request.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  for (const baseUrl of resolveBackendUrls()) {
    if (process.env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
      continue;
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (typeof data?.message === "string" && data.message.trim()) {
        return {
          message: data.message,
          structuredMessage: data.structuredMessage,
        };
      }
    } catch {
      // Try next backend or fall back to built-in responder.
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const assistantType =
      typeof body.assistantType === "string" ? body.assistantType : "general";
    const mode = typeof body.mode === "string" ? body.mode : undefined;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const proxied = await proxyToBackend(request, {
      message,
      assistantType,
      mode,
      history,
    });

    if (proxied) {
      return NextResponse.json({
        success: true,
        message: proxied.message,
        structuredMessage: proxied.structuredMessage,
      });
    }

    const fallback = getMarketingChatReply(message, history);
    return NextResponse.json({
      success: true,
      message: fallback.message,
      structuredMessage: fallback.structuredMessage,
      source: "marketing-fallback",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Sorry, I encountered an error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
