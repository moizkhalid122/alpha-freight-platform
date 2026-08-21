import type { LucideIcon } from "lucide-react";

/** Soft premium admin design tokens. */
export const ADMIN_PAGE = "admin-page-stack space-y-5";
export const ADMIN_CARD =
  "admin-card rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-[box-shadow,transform,border-color] duration-300 ease-out";
export const ADMIN_CARD_INTERACTIVE =
  "admin-card-interactive hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_8px_28px_rgba(15,23,42,0.07)]";
export const ADMIN_SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400";
export const ADMIN_SECTION_TITLE = "text-xl font-bold tracking-tight text-slate-900";
export const ADMIN_INPUT =
  "admin-input h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 text-sm font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-100/70";
export const ADMIN_TABLE_HEAD =
  "border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

/** Soft icon container — no harsh dark boxes. */
export const ADMIN_ICON_BOX =
  "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-blue-600 ring-1 ring-blue-100/70 shadow-[0_1px_4px_rgba(59,130,246,0.08)]";
export const ADMIN_ICON_BOX_SM = "h-10 w-10";
export const ADMIN_ICON_BOX_MD = "h-11 w-11";
export const ADMIN_ICON_BOX_LG = "h-12 w-12";

export const ADMIN_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.22)] transition-all duration-200 hover:bg-blue-700 hover:shadow-[0_4px_14px_rgba(37,99,235,0.28)] active:scale-[0.98]";
export const ADMIN_BTN_PRIMARY_SM =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]";
export const ADMIN_PILL_ACTIVE = "bg-blue-600 text-white shadow-sm";
export const ADMIN_PILL_INACTIVE = "text-slate-500 hover:bg-white hover:text-slate-800";
export const ADMIN_PROGRESS = "h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500";

export const adminSelectClassNames = {
  control: () =>
    "admin-select-control flex min-h-9 items-center rounded-lg border border-slate-200/90 bg-slate-50/80 px-2.5 shadow-none transition-all duration-200 hover:border-slate-300",
  menu: () =>
    "mt-1.5 rounded-lg border border-slate-200/90 bg-white/95 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-sm",
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
      isSelected ? "bg-blue-50 text-blue-700 font-semibold" : isFocused ? "bg-slate-100 text-slate-900" : "text-slate-700"
    }`,
  placeholder: () => "text-[13px] text-slate-400",
  singleValue: () => "text-[13px] font-medium text-slate-900",
  input: () => "text-[13px] text-slate-900",
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "text-slate-400 p-1",
};

/** Shared react-select classNames for legacy admin pages using selectStyles(). */
export function adminSelectStyles() {
  return adminSelectClassNames;
}

export type AdminAccent = "emerald" | "blue" | "violet" | "amber" | "rose" | "slate";

export const ADMIN_ACCENT_STRIPE: Record<AdminAccent, string> = {
  emerald: "bg-gradient-to-b from-emerald-500 via-emerald-400/80 to-transparent",
  blue: "bg-gradient-to-b from-blue-500 via-blue-400/80 to-transparent",
  violet: "bg-gradient-to-b from-violet-500 via-violet-400/80 to-transparent",
  amber: "bg-gradient-to-b from-amber-500 via-amber-400/80 to-transparent",
  rose: "bg-gradient-to-b from-rose-500 via-rose-400/80 to-transparent",
  slate: "bg-gradient-to-b from-slate-600 via-slate-400/80 to-transparent",
};

export type AdminPageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  accent?: AdminAccent;
  actions?: React.ReactNode;
};
