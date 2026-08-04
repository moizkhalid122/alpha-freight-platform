export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type StoredChat = {
  id: string;
  title: string;
  messages: StoredChatMessage[];
  updatedAt: number;
};

const STORAGE_KEY = "af_public_ai_recent_chats";
const MAX_CHATS = 5;

export function loadRecentChats(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CHATS) : [];
  } catch {
    return [];
  }
}

export function saveRecentChat(chat: StoredChat): StoredChat[] {
  if (typeof window === "undefined") return [];
  const existing = loadRecentChats().filter((c) => c.id !== chat.id);
  const next = [chat, ...existing].slice(0, MAX_CHATS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteRecentChat(id: string): StoredChat[] {
  if (typeof window === "undefined") return [];
  const next = loadRecentChats().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
