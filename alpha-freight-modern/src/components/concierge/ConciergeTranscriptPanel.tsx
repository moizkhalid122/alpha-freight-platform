"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import type { ChatHistoryItem } from "@/lib/chat-types";

type ConciergeTranscriptPanelProps = {
  messages: ChatHistoryItem[];
  textInput: string;
  onTextInputChange: (value: string) => void;
  onSendText: () => void;
  disabled?: boolean;
  compact?: boolean;
  /** Voice-only concierge — hide type box */
  voiceOnly?: boolean;
};

export default function ConciergeTranscriptPanel({
  messages,
  textInput,
  onTextInputChange,
  onSendText,
  disabled = false,
  compact = false,
  voiceOnly = false,
}: ConciergeTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || disabled) return;
    onSendText();
  };

  return (
    <div
      className={`flex w-full flex-col ${compact ? "gap-2" : "gap-3"} ${
        compact ? "max-h-[9rem]" : "max-h-[11rem]"
      }`}
    >
      {messages.length > 0 ? (
        <div
          ref={scrollRef}
          className={`w-full overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-left backdrop-blur-sm ${
            compact ? "max-h-[5.5rem] text-[12px]" : "max-h-[7rem] text-[13px]"
          }`}
        >
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={`${msg.role}-${i}`}>
                <p
                  className={`text-[9px] font-semibold uppercase tracking-[0.16em] ${
                    msg.role === "user" ? "text-slate-400" : "text-sky-600"
                  }`}
                >
                  {msg.role === "user" ? "You" : "Alpha"}
                </p>
                <p className="mt-0.5 leading-snug text-slate-700">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!voiceOnly ? (
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            placeholder="Type if you prefer…"
            disabled={disabled}
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={disabled || !textInput.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : null}
    </div>
  );
}
