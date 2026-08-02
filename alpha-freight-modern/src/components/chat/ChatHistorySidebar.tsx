"use client";

import { useEffect, useState } from "react";
import { History, Plus, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type ChatConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

interface ChatHistorySidebarProps {
  assistantType: "carrier" | "supplier";
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
}

export default function ChatHistorySidebar({
  assistantType,
  activeId,
  onSelect,
  onNew,
  open,
  onClose,
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/chat/history?assistantType=${assistantType}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
    }
    load();
  }, [open, assistantType]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/chat/history?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setConversations((c) => c.filter((conv) => conv.id !== id));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-72 flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <History className="h-4 w-4" /> Chat History
          </div>
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {!conversations.length && (
            <p className="px-2 py-4 text-xs text-slate-400">No saved chats yet. Start a conversation!</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => { onSelect(conv.id); onClose(); }}
              className={`group mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition ${
                activeId === conv.id ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-800">{conv.title}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(conv.id, e)}
                className="hidden shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 group-hover:block"
                aria-label="Delete chat"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
