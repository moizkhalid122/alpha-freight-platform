"use client";

import { Paperclip, Mic, Link2, Smile, Sparkles, Send, Image as ImageIcon } from "lucide-react";
import { useCallback } from "react";

type Variant = "emerald" | "blue" | "slate";

const stylesByVariant: Record<Variant, { focusRing: string; focusBorder: string; sendBg: string }> = {
  emerald: {
    focusRing: "focus-within:ring-4 focus-within:ring-emerald-500/10",
    focusBorder: "focus-within:border-emerald-500",
    sendBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  blue: {
    focusRing: "focus-within:ring-4 focus-within:ring-blue-500/10",
    focusBorder: "focus-within:border-blue-500",
    sendBg: "bg-blue-600 hover:bg-blue-700",
  },
  slate: {
    focusRing: "focus-within:ring-4 focus-within:ring-slate-900/10",
    focusBorder: "focus-within:border-slate-900",
    sendBg: "bg-slate-900 hover:bg-slate-800",
  },
};

interface PreChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: Variant;
}

export default function PreChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Ask anything...",
  variant = "slate",
}: PreChatComposerProps) {
  const style = stylesByVariant[variant];

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!disabled) {
          onSend();
        }
      }
    },
    [disabled, onSend]
  );

  const iconButtonClass =
    "rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40";

  return (
    <div className={`w-full rounded-2xl border border-slate-200 bg-white shadow-sm ${style.focusRing} ${style.focusBorder}`}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-[88px] w-full resize-none bg-transparent px-5 py-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-70"
      />
      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
        <div className="flex items-center gap-1">
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Attach">
            <Paperclip className="h-4 w-4" />
          </button>
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Add image">
            <ImageIcon className="h-4 w-4" />
          </button>
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Insert link">
            <Link2 className="h-4 w-4" />
          </button>
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Voice input">
            <Mic className="h-4 w-4" />
          </button>
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Emoji">
            <Smile className="h-4 w-4" />
          </button>
          <button type="button" disabled={disabled} className={iconButtonClass} aria-label="Quick ideas">
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={onSend}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${style.sendBg}`}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
