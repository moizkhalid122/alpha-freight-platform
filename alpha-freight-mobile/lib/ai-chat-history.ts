import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AiChatHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  title?: string;
  sectionLabel?: string;
  bullets?: string[];
  footer?: string;
  createdAt?: string;
};

export type AiChatConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type UserMessageContent = {
  text: string;
};

type AssistantMessageContent = {
  title?: string;
  sectionLabel?: string;
  bullets?: string[];
  footer?: string;
};

function buildConversationTitle(rawTitle?: string | null, fallback = "New chat") {
  const cleaned = String(rawTitle || "").trim();
  if (!cleaned) return fallback;
  return cleaned.length > 72 ? `${cleaned.slice(0, 72).trim()}…` : cleaned;
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function serializeUserMessage(message: Pick<AiChatHistoryMessage, "text">): UserMessageContent {
  return { text: message.text };
}

function serializeAssistantMessage(
  message: Pick<AiChatHistoryMessage, "title" | "sectionLabel" | "bullets" | "footer">
): AssistantMessageContent {
  return {
    title: message.title,
    sectionLabel: message.sectionLabel,
    bullets: message.bullets,
    footer: message.footer,
  };
}

function mapRowToMessage(row: {
  id: string;
  role: "user" | "assistant";
  content: UserMessageContent | AssistantMessageContent;
  created_at: string;
}): AiChatHistoryMessage | null {
  if (row.role === "user") {
    const content = row.content as UserMessageContent;
    if (!content?.text) return null;
    return {
      id: row.id,
      role: "user",
      text: content.text,
      createdAt: row.created_at,
    };
  }

  const content = row.content as AssistantMessageContent;
  return {
    id: row.id,
    role: "assistant",
    text: "",
    title: content.title,
    sectionLabel: content.sectionLabel,
    bullets: content.bullets,
    footer: content.footer,
    createdAt: row.created_at,
  };
}

export async function listAiChatConversations(
  assistantType: "carrier" | "supplier" | "general" = "carrier"
): Promise<AiChatConversationSummary[]> {
  if (!isSupabaseConfigured) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("ai_chat_conversations")
    .select("id, title, updated_at, created_at")
    .eq("user_id", user.id)
    .eq("assistant_type", assistantType)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    title: buildConversationTitle(row.title),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }));
}

export async function loadAiChatConversationMessages(
  conversationId: string
): Promise<AiChatHistoryMessage[]> {
  if (!isSupabaseConfigured || !conversationId) return [];

  const { data: rows, error } = await supabase
    .from("ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(120);

  if (error || !rows?.length) return [];

  return rows
    .map((row) =>
      mapRowToMessage({
        id: row.id,
        role: row.role as "user" | "assistant",
        content: row.content as UserMessageContent | AssistantMessageContent,
        created_at: row.created_at,
      })
    )
    .filter(Boolean) as AiChatHistoryMessage[];
}

async function createAiChatConversation(
  userId: string,
  assistantType: "carrier" | "supplier" | "general",
  title: string
): Promise<string | null> {
  const { data: created, error } = await supabase
    .from("ai_chat_conversations")
    .insert({
      user_id: userId,
      assistant_type: assistantType,
      title: buildConversationTitle(title),
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return null;
  }

  return created.id;
}

export async function saveAiChatUserMessage(
  conversationId: string | null,
  message: Pick<AiChatHistoryMessage, "text">,
  assistantType: "carrier" | "supplier" | "general" = "carrier"
): Promise<{ conversationId: string | null; messageId: string | null }> {
  if (!isSupabaseConfigured) {
    return { conversationId: null, messageId: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversationId: null, messageId: null };
  }

  const activeConversationId =
    conversationId || (await createAiChatConversation(user.id, assistantType, message.text));

  if (!activeConversationId) {
    return { conversationId: null, messageId: null };
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({
      conversation_id: activeConversationId,
      role: "user",
      content: serializeUserMessage(message),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { conversationId: activeConversationId, messageId: null };
  }

  await supabase
    .from("ai_chat_conversations")
    .update({
      updated_at: new Date().toISOString(),
      title: buildConversationTitle(message.text),
    })
    .eq("id", activeConversationId);

  return { conversationId: activeConversationId, messageId: data.id };
}

export async function saveAiChatAssistantMessage(
  conversationId: string | null,
  message: Pick<AiChatHistoryMessage, "title" | "sectionLabel" | "bullets" | "footer">
): Promise<{ conversationId: string | null; messageId: string | null }> {
  if (!isSupabaseConfigured || !conversationId) {
    return { conversationId, messageId: null };
  }

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: serializeAssistantMessage(message),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { conversationId, messageId: null };
  }

  await supabase
    .from("ai_chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { conversationId, messageId: data.id };
}

export async function deleteAiChatMessage(messageId: string): Promise<void> {
  if (!isSupabaseConfigured || !messageId) return;

  await supabase.from("ai_chat_messages").delete().eq("id", messageId);
}

export async function deleteAiChatConversation(conversationId: string): Promise<void> {
  if (!isSupabaseConfigured || !conversationId) return;

  await supabase.from("ai_chat_conversations").delete().eq("id", conversationId);
}

export function formatAiConversationSubtitle(conversation: AiChatConversationSummary) {
  return formatConversationDate(conversation.updatedAt);
}

export function buildDynamicSuggestions(context: {
  pendingBids?: number;
  availableLoads?: number;
  activeLoads?: number;
} | null): string[] {
  const suggestions: string[] = [];

  if ((context?.availableLoads || 0) > 0) {
    suggestions.push("Show me my best available loads");
  }

  if ((context?.pendingBids || 0) > 0) {
    suggestions.push("What are my pending bids?");
  } else {
    suggestions.push("What is my wallet balance?");
  }

  if ((context?.activeLoads || 0) > 0) {
    suggestions.push("What are my active loads?");
  } else {
    suggestions.push("UK diesel price today?");
  }

  return suggestions.slice(0, 3);
}
