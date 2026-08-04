"use client";

import {
  Copy,
  MoreHorizontal,
  RefreshCcw,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

interface AssistantMessageActionsProps {
  messageId: string;
  isCopied: boolean;
  feedback?: "up" | "down" | null;
  onCopy: (messageId: string) => void;
  onFeedback: (messageId: string, value: "up" | "down") => void;
  onShare: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onMore: (messageId: string) => void;
}

function actionButtonClass(isActive = false): string {
  return `rounded-full p-1.5 transition ${
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
  }`;
}

export default function AssistantMessageActions({
  messageId,
  isCopied,
  feedback = null,
  onCopy,
  onFeedback,
  onShare,
  onRegenerate,
  onMore,
}: AssistantMessageActionsProps) {
  return (
    <div className="mt-2 flex items-center gap-1 text-slate-500">
      <button
        type="button"
        aria-label="Copy reply"
        title={isCopied ? "Copied" : "Copy"}
        onClick={() => onCopy(messageId)}
        className={actionButtonClass(isCopied)}
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Like reply"
        title="Like"
        onClick={() => onFeedback(messageId, "up")}
        className={actionButtonClass(feedback === "up")}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Dislike reply"
        title="Dislike"
        onClick={() => onFeedback(messageId, "down")}
        className={actionButtonClass(feedback === "down")}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Share reply"
        title="Share"
        onClick={() => onShare(messageId)}
        className={actionButtonClass()}
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Regenerate reply"
        title="Regenerate"
        onClick={() => onRegenerate(messageId)}
        className={actionButtonClass()}
      >
        <RefreshCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="More actions"
        title="More"
        onClick={() => onMore(messageId)}
        className={actionButtonClass()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
