"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import {
  filterSiteLocales,
  findSiteLocale,
  type SiteLocale,
} from "@/lib/site-languages";
import {
  getSiteLocaleId,
  setSiteLocaleId,
  SITE_LOCALE_CHANGE_EVENT,
} from "@/lib/site-language-preference";
import { useSiteT, useSiteLanguage } from "@/components/SiteLanguageProvider";

type LanguageSelectorProps = {
  isDark?: boolean;
  megaMenuOpen?: boolean;
  className?: string;
};

function FlagBadge({ flag, size = 20 }: { flag: string; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-black/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://flagcdn.com/w80/${flag}.png`}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
        unoptimized
      />
    </span>
  );
}

export default function LanguageSelector({
  isDark = false,
  megaMenuOpen = false,
  className = "",
}: LanguageSelectorProps) {
  const t = useSiteT();
  const { isRtl } = useSiteLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localeId, setLocaleId] = useState(DEFAULT_FALLBACK);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    right: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => findSiteLocale(localeId), [localeId]);
  const results = useMemo(() => filterSiteLocales(query), [query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocaleId(getSiteLocaleId());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id) setLocaleId(detail.id);
    };
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    const syncPanel = () => {
      const trigger = rootRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 32);
      const rtl = document.documentElement.dir === "rtl" || isRtl;

      setPanelPos({
        top: rect.bottom + 10,
        right: rtl ? 16 : Math.max(16, window.innerWidth - rect.right),
        width,
      });
    };

    syncPanel();
    window.addEventListener("resize", syncPanel);
    window.addEventListener("scroll", syncPanel, true);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element;
      if (rootRef.current?.contains(target as Node)) return;
      if (target.closest("[data-af-lang-panel]")) return;
      setOpen(false);
      setQuery("");
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", syncPanel);
      window.removeEventListener("scroll", syncPanel, true);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, isRtl]);

  const pickLocale = (locale: SiteLocale) => {
    setLocaleId(locale.id);
    setSiteLocaleId(locale.id);
    setOpen(false);
    setQuery("");
  };

  const triggerClass =
    megaMenuOpen || !isDark
      ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50";

  const panel =
    open && panelPos ? (
      <motion.div
        ref={listRef}
        data-af-lang-panel
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "fixed",
          top: panelPos.top,
          right: panelPos.right,
          width: panelPos.width,
          zIndex: 9999,
        }}
        className="flex max-h-[min(420px,calc(100dvh-96px))] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] notranslate"
        dir="ltr"
        role="listbox"
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <p className="text-[14px] font-semibold text-slate-900">{t("lang.selectTitle")}</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("lang.search")}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 touch-pan-y [scrollbar-color:rgba(148,163,184,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          {results.map((locale) => {
            const active = locale.id === localeId;
            return (
              <button
                key={locale.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pickLocale(locale)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  active ? "bg-orange-50/80" : "hover:bg-slate-50"
                }`}
              >
                <FlagBadge flag={locale.flag} size={22} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-900">
                  {locale.country}
                </span>
                <span className="shrink-0 text-[13px] text-slate-400">{locale.language}</span>
              </button>
            );
          })}
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-slate-400">{t("lang.noMatches")}</p>
          ) : null}
        </div>
      </motion.div>
    ) : null;

  return (
    <div ref={rootRef} className={`notranslate relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${triggerClass}`}
      >
        <FlagBadge flag={selected.flag} size={18} />
        <span>{selected.code}</span>
      </button>

      {mounted ? createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body) : null}
    </div>
  );
}

const DEFAULT_FALLBACK = "en-gb";
