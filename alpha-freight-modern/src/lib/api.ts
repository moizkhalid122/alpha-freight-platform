import type { ChatApiResponse, SendChatMessageOptions } from "@/lib/chat-types";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

async function buildChatHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function sendChatMessage(
  message: string,
  options: SendChatMessageOptions = {}
): Promise<ChatApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const headers = await buildChatHeaders();
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        message,
        assistantType: options.assistantType || "general",
        mode: options.mode,
        history: options.history || [],
      }),
    });

    if (response.status === 401) {
      return {
        message: 'Please log in again to use AI assistant.',
      };
    }

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return {
      message: data.message,
      structuredMessage: data.structuredMessage,
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        message: 'Sorry, AI thori slow chal rahi ha. Dobara try karein ya apna sawal thora short bhejein.',
      };
    }

    return {
      message: 'Sorry, I encountered an error. Please try again later.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
