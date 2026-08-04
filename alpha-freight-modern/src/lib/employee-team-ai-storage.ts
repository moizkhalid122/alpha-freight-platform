export type EmployeeStoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type EmployeeStoredChat = {
  id: string;
  title: string;
  messages: EmployeeStoredChatMessage[];
  updatedAt: number;
};

const STORAGE_KEY = "af_team_ai_recent_chats";
const MAX_CHATS = 8;

export function loadEmployeeTeamAiChats(): EmployeeStoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmployeeStoredChat[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CHATS) : [];
  } catch {
    return [];
  }
}

export function saveEmployeeTeamAiChat(chat: EmployeeStoredChat): EmployeeStoredChat[] {
  if (typeof window === "undefined") return [];
  const existing = loadEmployeeTeamAiChats().filter((c) => c.id !== chat.id);
  const next = [chat, ...existing].slice(0, MAX_CHATS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteEmployeeTeamAiChat(id: string): EmployeeStoredChat[] {
  if (typeof window === "undefined") return [];
  const next = loadEmployeeTeamAiChats().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
