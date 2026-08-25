"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  Fuel,
  Globe,
  ImageIcon,
  Paperclip,
  Receipt,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type AiAttachMenuProps = {
  disabled?: boolean;
  menuPlacement?: "up" | "down";
  onPickImage: () => void;
  onQuickPrompt: (prompt: string) => void;
  onWebSearch: () => void;
};

type MenuItem = {
  id: string;
  label: string;
  icon: ReactNode;
  action: () => void;
};

type MenuPosition = {
  left: number;
  bottom: number;
  width: number;
};

const LIVE_SEARCH_KEY = "alpha-ai-live-search";
const MENU_PANEL_CLASS =
  "overflow-hidden rounded-[20px] border border-[#e8eaed] bg-white/95 py-1.5 shadow-[0_8px_28px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)] backdrop-blur-xl";

export default function AiAttachMenu({
  disabled = false,
  menuPlacement = "down",
  onPickImage,
  onQuickPrompt,
  onWebSearch,
}: AiAttachMenuProps) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [liveSearch, setLiveSearch] = useState(true);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ left: 0, bottom: 0, width: 300 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIVE_SEARCH_KEY);
      if (stored !== null) setLiveSearch(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({
      left: Math.max(8, rect.left),
      bottom: window.innerHeight - rect.top + 8,
      width: Math.min(300, window.innerWidth - 16),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open || menuPlacement !== "up") return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, menuPlacement, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      setMoreOpen(false);
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeAndRun = (action: () => void) => {
    setOpen(false);
    action();
  };

  const uploadItems: MenuItem[] = [
    {
      id: "photos",
      label: "Add photos & files",
      icon: <Paperclip className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onPickImage(),
    },
    {
      id: "pod",
      label: "Upload POD or receipt",
      icon: <Receipt className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onPickImage(),
    },
  ];

  const moreUploadItems: MenuItem[] = [
    {
      id: "fuel-receipt",
      label: "Fuel receipt",
      icon: <Fuel className="h-4 w-4 text-[#5f6368]" strokeWidth={1.75} />,
      action: () => onPickImage(),
    },
    {
      id: "load-photo",
      label: "Load or vehicle photo",
      icon: <ImageIcon className="h-4 w-4 text-[#5f6368]" strokeWidth={1.75} />,
      action: () => onPickImage(),
    },
  ];

  const toolItems: MenuItem[] = [
    {
      id: "web-search",
      label: "Web search",
      icon: <Globe className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onWebSearch(),
    },
    {
      id: "profit",
      label: "Profit calculator",
      icon: <Calculator className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onQuickPrompt("Calculate profit £800 for 320 miles"),
    },
    {
      id: "find-loads",
      label: "Find loads",
      icon: <Truck className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onQuickPrompt("How do I find loads in the UK?"),
    },
    {
      id: "rpm",
      label: "RPM & fuel help",
      icon: <Fuel className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => onQuickPrompt("What is RPM in haulage?"),
    },
    {
      id: "knowledge",
      label: "Knowledge base",
      icon: <BookOpen className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />,
      action: () => {},
    },
  ];

  const toggleLiveSearch = () => {
    const next = !liveSearch;
    setLiveSearch(next);
    try {
      localStorage.setItem(LIVE_SEARCH_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  const opensUp = menuPlacement === "up";
  const menuMotion = opensUp
    ? {
        initial: { opacity: 0, y: 10, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.97 },
      }
    : {
        initial: { opacity: 0, y: -8, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -6, scale: 0.97 },
      };

  const menuPanel = (
    <AttachMenuPanel
      disabled={disabled}
      uploadItems={uploadItems}
      moreUploadItems={moreUploadItems}
      toolItems={toolItems}
      moreOpen={moreOpen}
      liveSearch={liveSearch}
      onMoreToggle={() => setMoreOpen((value) => !value)}
      onClose={() => setOpen(false)}
      onSelect={closeAndRun}
      onToggleLiveSearch={toggleLiveSearch}
    />
  );

  const menuNode = (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={menuRef}
          initial={menuMotion.initial}
          animate={menuMotion.animate}
          exit={menuMotion.exit}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={
            opensUp
              ? `${MENU_PANEL_CLASS} fixed z-[120]`
              : `${MENU_PANEL_CLASS} absolute left-0 top-full z-40 mt-2 w-[min(300px,calc(100vw-2rem))]`
          }
          style={
            opensUp
              ? {
                  left: menuPosition.left,
                  bottom: menuPosition.bottom,
                  width: menuPosition.width,
                }
              : undefined
          }
        >
          {menuPanel}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={`mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 disabled:opacity-50 ${
          open ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-[#f1f3f4]"
        }`}
        aria-label={open ? "Close menu" : "Add attachment"}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <PlusIcon />}
          </motion.span>
        </AnimatePresence>
      </button>

      {opensUp
        ? typeof document !== "undefined"
          ? createPortal(menuNode, document.body)
          : null
        : menuNode}
    </div>
  );
}

function AttachMenuPanel({
  disabled,
  uploadItems,
  moreUploadItems,
  toolItems,
  moreOpen,
  liveSearch,
  onMoreToggle,
  onClose,
  onSelect,
  onToggleLiveSearch,
}: {
  disabled: boolean;
  uploadItems: MenuItem[];
  moreUploadItems: MenuItem[];
  toolItems: MenuItem[];
  moreOpen: boolean;
  liveSearch: boolean;
  onMoreToggle: () => void;
  onClose: () => void;
  onSelect: (action: () => void) => void;
  onToggleLiveSearch: () => void;
}) {
  return (
    <>
      <div className="px-1.5">
        {uploadItems.map((item, index) => (
          <MenuRow
            key={item.id}
            item={item}
            index={index}
            disabled={disabled}
            onSelect={() => onSelect(item.action)}
          />
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={onMoreToggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f1f3f4] disabled:opacity-50"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <MoreDotsIcon />
          </span>
          <span className="flex-1 text-[14px] text-[#1f1f1f]">More uploads</span>
          <motion.span animate={{ rotate: moreOpen ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-[#5f6368]">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {moreOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="ml-8 border-l border-[#e8eaed] py-0.5 pl-2">
                {moreUploadItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(item.action)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#1f1f1f] disabled:opacity-50"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mx-3 my-1.5 h-px bg-[#e8eaed]" />

      <div className="px-1.5">
        {toolItems.map((item, index) =>
          item.id === "knowledge" ? (
            <Link
              key={item.id}
              href="/knowledge-base"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f1f3f4]"
            >
              {item.icon}
              <span className="text-[14px] text-[#1f1f1f]">{item.label}</span>
            </Link>
          ) : (
            <MenuRow
              key={item.id}
              item={item}
              index={index + uploadItems.length + 1}
              disabled={disabled}
              onSelect={() => onSelect(item.action)}
            />
          )
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={onToggleLiveSearch}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f1f3f4] disabled:opacity-50"
        >
          <Sparkles className="h-[18px] w-[18px] text-[#444746]" strokeWidth={1.75} />
          <span className="flex-1 text-[14px] text-[#1f1f1f]">Live web insights</span>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
              liveSearch ? "bg-[#1a73e8]" : "bg-[#dadce0]"
            }`}
            aria-hidden
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm ${
                liveSearch ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>
    </>
  );
}

function MenuRow({
  item,
  index,
  disabled,
  onSelect,
}: {
  item: MenuItem;
  index: number;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f1f3f4] disabled:opacity-50"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
      <span className="text-[14px] text-[#1f1f1f]">{item.label}</span>
    </motion.button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MoreDotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px] text-[#444746]">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function AiImagePreview({
  imageUrl,
  onRemove,
}: {
  imageUrl: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative mb-2 inline-flex max-w-[180px] overflow-hidden rounded-xl border border-[#ececec] bg-white p-1 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Upload preview" className="h-24 w-auto max-w-full rounded-lg object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition hover:bg-black"
        aria-label="Remove image"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
        <ImageIcon className="h-3 w-3" />
        Image attached
      </div>
    </div>
  );
}
