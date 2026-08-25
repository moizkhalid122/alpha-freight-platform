"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Flag,
  GitBranch,
  MoreHorizontal,
  RotateCw,
  Route,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Link2,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type AiReplyActionsProps = {
  messageId: string;
  isLatest?: boolean;
  copied: boolean;
  shared: boolean;
  feedback: "up" | "down" | null;
  disabled?: boolean;
  responseTimeMs?: number;
  knowledgeSource?: string;
  userQuery?: string;
  onFeedback: (value: "up" | "down") => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onWhatsAppShare: () => void;
  onCopyShareLink: () => void;
  onBranchNewChat: () => void;
};

const SOURCE_LABELS: Record<string, string> = {
  openai: "AI + Knowledge",
  "knowledge-base": "Knowledge Base",
  "help-centre": "Help Centre",
  web_search: "Live web data",
  "openai+web": "AI + Live web",
  instant: "Built-in answer",
};

function ActionIcon({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95 sm:h-8 sm:w-8 ${
        active ? "bg-[#f1f3f4] text-[#0a0a0a]" : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
      }`}
    >
      {children}
    </button>
  );
}

export default function AiReplyActions({
  messageId,
  isLatest = false,
  copied,
  shared,
  feedback,
  disabled = false,
  responseTimeMs,
  knowledgeSource,
  userQuery,
  onFeedback,
  onCopy,
  onRegenerate,
  onWhatsAppShare,
  onCopyShareLink,
  onBranchNewChat,
}: AiReplyActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const sourceLabel = knowledgeSource ? SOURCE_LABELS[knowledgeSource] || knowledgeSource : "Knowledge Base";
  const seconds = responseTimeMs ? (responseTimeMs / 1000).toFixed(1) : null;
  const visibilityClass = isLatest
    ? "opacity-100"
    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-within:opacity-100";

  return (
    <div ref={rootRef} className={`mt-3 transition-opacity duration-200 ${visibilityClass}`}>
      <div className="flex items-center gap-0.5">
        <ActionIcon
          label="Good response"
          active={feedback === "up"}
          onClick={() => onFeedback("up")}
        >
          <ThumbsUp className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </ActionIcon>
        <ActionIcon
          label="Bad response"
          active={feedback === "down"}
          onClick={() => onFeedback("down")}
        >
          <ThumbsDown className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </ActionIcon>
        <ActionIcon label="Regenerate response" onClick={onRegenerate}>
          <RotateCw className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </ActionIcon>
        <ActionIcon label={copied ? "Copied" : "Copy response"} active={copied} onClick={onCopy}>
          <Copy className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </ActionIcon>

        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMenuOpen((value) => !value);
              setDetailsOpen(false);
            }}
            aria-label="More actions"
            aria-expanded={menuOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 sm:h-8 sm:w-8 ${
              menuOpen ? "bg-[#f1f3f4] text-[#0a0a0a]" : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
            }`}
          >
            <MoreHorizontal className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-full z-40 mt-2 w-[min(272px,calc(100vw-2rem))] overflow-hidden rounded-[20px] border border-[#e8eaed]/90 bg-white/95 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              >
                <div className="px-1.5">
                  <MenuItem
                    index={0}
                    icon={<GitBranch className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    label="Branch in new chat"
                    onClick={() => {
                      closeMenu();
                      onBranchNewChat();
                    }}
                  />
                  <MenuItem
                    index={1}
                    icon={<Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    label="Share on WhatsApp"
                    onClick={() => {
                      closeMenu();
                      onWhatsAppShare();
                    }}
                  />
                  <MenuItem
                    index={2}
                    icon={<Link2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    label={shared ? "Link copied" : "Copy share link"}
                    onClick={() => {
                      closeMenu();
                      onCopyShareLink();
                    }}
                  />
                </div>
                <div className="mx-3 my-1.5 h-px bg-[#eceff1]" />
                <div className="px-1.5">
                  <MenuItem
                    index={3}
                    icon={<Flag className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    label="Report an issue"
                    href="mailto:support@alphafreightuk.com?subject=Alpha%20Freight%20AI%20Report"
                    onClick={closeMenu}
                  />
                  <MenuItem
                    index={4}
                    icon={<Route className="h-[18px] w-[18px]" strokeWidth={1.75} />}
                    label="See response details"
                    onClick={() => {
                      closeMenu();
                      setDetailsOpen((value) => !value);
                    }}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {detailsOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-[#e8eaed] bg-[#fafafa] px-3 py-2.5 text-[12px] leading-relaxed text-[#5f6368]">
              <p>
                <span className="font-medium text-[#202124]">Source:</span> {sourceLabel}
              </p>
              {seconds ? (
                <p className="mt-1">
                  <span className="font-medium text-[#202124]">Response time:</span> {seconds}s
                </p>
              ) : null}
              {userQuery ? (
                <p className="mt-1">
                  <span className="font-medium text-[#202124]">Question:</span> {userQuery}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-[#9aa0a6]">Message ID: {messageId.slice(-8)}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  href,
  index = 0,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  href?: string;
  index?: number;
}) {
  const className =
    "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14px] text-[#202124] transition-colors hover:bg-[#f1f3f4] active:bg-[#e8eaed]";

  const content = (
    <>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#444746]">{icon}</span>
      {label}
    </>
  );

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03, duration: 0.18 }}
      >
        <Link href={href} onClick={onClick} className={className}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.18 }}
      className={className}
    >
      {content}
    </motion.button>
  );
}
