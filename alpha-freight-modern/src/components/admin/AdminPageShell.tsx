"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ADMIN_ACCENT_STRIPE,
  ADMIN_CARD,
  ADMIN_CARD_INTERACTIVE,
  ADMIN_ICON_BOX,
  ADMIN_ICON_BOX_MD,
  ADMIN_PAGE,
  ADMIN_SECTION_LABEL,
  ADMIN_SECTION_TITLE,
  type AdminAccent,
} from "@/lib/admin-ui";

const ease = [0.22, 1, 0.36, 1] as const;

export function AdminPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(ADMIN_PAGE, className)}>{children}</div>;
}

export function AdminPageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent = "emerald",
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  accent?: AdminAccent;
  actions?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      className={cn(ADMIN_CARD, "relative overflow-hidden p-4 sm:p-5")}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className={cn("absolute inset-y-0 left-0 w-[3px]", ADMIN_ACCENT_STRIPE[accent])} />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-2.5">
          <div className={cn(ADMIN_ICON_BOX, ADMIN_ICON_BOX_MD)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={ADMIN_SECTION_LABEL}>{eyebrow}</p>
            <h1 className={ADMIN_SECTION_TITLE}>{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-[12px] leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
      </div>
    </motion.section>
  );
}

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  tone = "text-slate-900",
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: string;
  accent?: AdminAccent;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(ADMIN_CARD, ADMIN_CARD_INTERACTIVE, "relative overflow-hidden p-3.5")}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.22, ease }}
    >
      <div className={cn("absolute inset-y-0 left-0 w-[3px]", ADMIN_ACCENT_STRIPE[accent])} />
      <div className="flex items-center justify-between">
        <div className="rounded-md bg-slate-50 p-1.5 text-slate-600 ring-1 ring-slate-100">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-0.5 text-xl font-bold tracking-tight", tone)}>{value}</p>
    </motion.div>
  );
}

export function AdminPanel({
  children,
  className,
  padding = "p-4 sm:p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string | false;
}) {
  return (
    <section className={cn(ADMIN_CARD, padding !== false ? padding : undefined, className)}>
      {children}
    </section>
  );
}

export function AdminLoadingState({ message }: { message: string }) {
  return (
    <div
      className={cn(
        ADMIN_CARD,
        "flex items-center justify-center gap-2.5 px-5 py-10 text-[13px] font-medium text-slate-500"
      )}
    >
      {message}
    </div>
  );
}
