"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Search, Truck, MapPin, Package, ShieldCheck, Wallet, Navigation, FileText, Users } from "lucide-react";
import {
  brandPillars,
  brandValues,
  illustrationExamples,
  illustrationPrinciples,
  iconographyItems,
  iconographyRules,
  logoDonts,
  materialGuidelines,
  photographyExamples,
  photographyRules,
  socialTemplates,
  toneWords,
  typeScale,
  typographyRules,
  websitePatterns,
} from "@/lib/brand-kit-content";

const iconMap = {
  Truck,
  MapPin,
  Package,
  ShieldCheck,
  Wallet,
  Navigation,
  FileText,
  Users,
} as const;

type BrandColor = {
  name: string;
  hex: string;
  description?: string;
};

type LogoVariant = {
  id: string;
  backgroundClassName: string;
  textClassName: string;
  borderClassName?: string;
};

type BrandTab =
  | "introduction"
  | "mission"
  | "tone"
  | "colors"
  | "logo"
  | "typography"
  | "illustration"
  | "iconography"
  | "photography"
  | "website"
  | "social"
  | "materials";

const primaryColors: BrandColor[] = [
  {
    name: "Alpha Lime",
    hex: "#BFFF07",
    description: "Primary accent for highlights and CTAs.",
  },
  {
    name: "Midnight",
    hex: "#0B0F14",
    description: "Primary dark surface + strong text color.",
  },
  {
    name: "Deep Navy",
    hex: "#151B24",
    description: "Secondary dark surface used in gradients and premium panels.",
  },
  {
    name: "Paper",
    hex: "#FDFDFD",
    description: "Primary background for clean, premium UI.",
  },
  {
    name: "White",
    hex: "#FFFFFF",
    description: "Pure surface color for cards, sheets, and contrast moments.",
  },
  {
    name: "Slate",
    hex: "#64748B",
    description: "Secondary text, labels, and metadata.",
  },
];

const supportColors: BrandColor[] = [
  { name: "Success", hex: "#10B981", description: "Positive states and confirmations." },
  { name: "Warning", hex: "#F59E0B", description: "Risks, attention, and exceptions." },
  { name: "Danger", hex: "#EF4444", description: "Errors, blocks, and urgent issues." },
  { name: "Info", hex: "#3B82F6", description: "Neutral information and links." },
  { name: "Action Blue", hex: "#2563EB", description: "Primary interactive and chart accent." },
  { name: "Gold", hex: "#FFD666", description: "Warm highlight used in auth and promotions." },
];

const neutralColors: BrandColor[] = [
  { name: "Ink", hex: "#111111" },
  { name: "Midnight", hex: "#0B0F14" },
  { name: "Deep Navy", hex: "#151B24" },
  { name: "Charcoal", hex: "#2D2D2D" },
  { name: "Slate", hex: "#64748B" },
  { name: "Mist", hex: "#94A3B8" },
  { name: "Border", hex: "#E2E8F0" },
  { name: "Paper", hex: "#FDFDFD" },
];

const logoVariants: LogoVariant[] = [
  {
    id: "paper-primary",
    backgroundClassName: "bg-[#FDFDFD]",
    textClassName: "text-slate-900",
    borderClassName: "border border-slate-200/70",
  },
  {
    id: "violet-light",
    backgroundClassName: "bg-[#5A3FFF]",
    textClassName: "text-white",
  },
  {
    id: "midnight-light",
    backgroundClassName: "bg-[#0B0F14]",
    textClassName: "text-white",
  },
  {
    id: "paper-secondary",
    backgroundClassName: "bg-white",
    textClassName: "text-slate-900",
    borderClassName: "border border-slate-200/70",
  },
  {
    id: "soft-paper",
    backgroundClassName: "bg-[#F4F4F3]",
    textClassName: "text-slate-900",
    borderClassName: "border border-slate-200/60",
  },
  {
    id: "ink-light",
    backgroundClassName: "bg-black",
    textClassName: "text-white",
  },
];

const logoAssets = [
  {
    title: "Full Logo",
    file: "/alpha brand 1.png",
    surface: "bg-white",
    border: "border-slate-200/70",
    rule: "Use this version when both the symbol and brand name need to appear together.",
    previewClassName: "h-36 w-full max-w-[400px]",
  },
  {
    title: "Symbol",
    file: "/alpha brand 2.png",
    surface: "bg-white",
    border: "border-slate-200/70",
    rule: "Use the symbol in compact spaces like app icons, favicons, and tight UI placements.",
    previewClassName: "h-56 w-full max-w-[290px]",
  },
  {
    title: "Wordmark",
    file: "/alpha brand 3.png",
    surface: "bg-white",
    border: "border-slate-200/70",
    rule: "Use the wordmark where the brand name needs maximum clarity without the icon.",
    previewClassName: "h-32 w-full max-w-[390px]",
  },
];

const tabMeta: Record<
  BrandTab,
  { title: string; subtitle: string; headline: string; accent: string; background: string }
> = {
  introduction: {
    title: "Alpha Freight Brand Kit",
    subtitle: "A single source of truth for brand consistency.",
    headline: "Introduction",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  mission: {
    title: "Our Mission & Values",
    subtitle: "Premium freight operations, built on trust and execution.",
    headline: "Mission & Values",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  tone: {
    title: "Tone of Voice",
    subtitle: "Clear, confident, operator-first communication.",
    headline: "Tone of Voice",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  colors: {
    title: "The Alpha Freight Colors",
    subtitle: "A focused palette built for premium logistics UX.",
    headline: "Colors",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  logo: {
    title: "Logos & Marks",
    subtitle: "Approved logo assets and safe usage rules.",
    headline: "Logo",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  typography: {
    title: "Typography",
    subtitle: "Hierarchy, spacing, and readability rules.",
    headline: "Typography",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  illustration: {
    title: "Illustration",
    subtitle: "Simple, calm, and operational visuals.",
    headline: "Illustration",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  iconography: {
    title: "Iconography",
    subtitle: "Consistent line icons with clean spacing.",
    headline: "Iconography",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  photography: {
    title: "Photography",
    subtitle: "Real ops, real people, real freight environments.",
    headline: "Photography",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  website: {
    title: "In Action: Website",
    subtitle: "How the brand looks across web surfaces.",
    headline: "Website",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  social: {
    title: "In Action: Social Media",
    subtitle: "Templates for social posts and announcements.",
    headline: "Social Media",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
  materials: {
    title: "In Action: Promotional Materials",
    subtitle: "Sales decks, brochures, and partner collateral.",
    headline: "Materials",
    accent: "#BFFF07",
    background: "from-[#0B0F14] to-[#151B24]",
  },
};

const navGroups: Array<{
  title: string;
  items: Array<{ id: BrandTab; label: string }>;
}> = [
  {
    title: "Our Brand",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "mission", label: "Mission & Values" },
      { id: "tone", label: "Tone of Voice" },
    ],
  },
  {
    title: "Core Elements",
    items: [
      { id: "colors", label: "Color" },
      { id: "logo", label: "Logo" },
      { id: "typography", label: "Typography" },
      { id: "illustration", label: "Illustration" },
      { id: "iconography", label: "Iconography" },
      { id: "photography", label: "Photography" },
    ],
  },
  {
    title: "In Action",
    items: [
      { id: "website", label: "Website" },
      { id: "social", label: "Social Media" },
      { id: "materials", label: "Promotional Materials" },
    ],
  },
];

function SidebarLink({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function TallColorCard({
  color,
  copied,
  onCopy,
}: {
  color: BrandColor;
  copied: boolean;
  onCopy: () => void;
}) {
  const hex = color.hex.toUpperCase();
  const rgb = useMemo(() => {
    const cleaned = hex.replace("#", "").trim();
    if (cleaned.length !== 6) return null;
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some((value) => Number.isNaN(value))) return null;
    return { r, g, b };
  }, [hex]);

  const cmyk = useMemo(() => {
    if (!rgb) return null;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const k = 1 - Math.max(r, g, b);
    if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    const toPct = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100)));
    return { c: toPct(c), m: toPct(m), y: toPct(y), k: toPct(k) };
  }, [rgb]);

  return (
    <div className="group flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-600">{color.name}</p>
      <div
        className="relative h-[340px] w-full overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-sm"
        style={{ backgroundColor: hex }}
      >
        <div className="absolute inset-x-0 bottom-8 flex justify-center transition group-hover:opacity-0">
          <div className="rounded-full bg-black/15 px-6 py-2 backdrop-blur">
            <p className="text-xs font-black text-white">{hex}</p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <div className="pointer-events-auto rounded-t-[1.75rem] bg-white px-6 py-5 shadow-[0_-24px_60px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-black text-slate-800 transition hover:bg-slate-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy HEX"}
              </button>
            </div>

            <div className="mt-5 space-y-2 text-sm font-semibold text-slate-900">
              <p>CMYK: {cmyk ? `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}` : "N/A"}</p>
              <p>RGB: {rgb ? `${rgb.r} ${rgb.g} ${rgb.b}` : "N/A"}</p>
              <p>HEX: {hex}</p>
            </div>
          </div>
        </div>
      </div>
      {color.description ? (
        <p className="text-sm font-medium leading-6 text-slate-500">{color.description}</p>
      ) : null}
    </div>
  );
}

function NeutralSwatchCard({ color }: { color: BrandColor }) {
  const hex = color.hex.toUpperCase();
  const rgb = useMemo(() => {
    const cleaned = hex.replace("#", "").trim();
    if (cleaned.length !== 6) return null;
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);
    if ([r, g, b].some((value) => Number.isNaN(value))) return null;
    return { r, g, b };
  }, [hex]);

  const isLight = useMemo(() => {
    if (!rgb) return false;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.66;
  }, [rgb]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-600">{color.name}</p>
      <div
        className="flex h-56 items-center justify-center rounded-[2.25rem] border border-slate-200 bg-white shadow-sm"
        style={{ backgroundColor: hex }}
      >
        <p className={`text-xs font-black ${isLight ? "text-slate-900" : "text-white"}`}>{hex}</p>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm ${className}`}>
      {eyebrow ? (
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
      ) : null}
      {title ? (
        <p className={`${eyebrow ? "mt-5" : ""} text-2xl font-black tracking-tight text-slate-900`}>{title}</p>
      ) : null}
      {children}
    </div>
  );
}

function DoDontGrid({ doItems, dontItems }: { doItems: string[]; dontItems: string[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Do</p>
        <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-emerald-950/80">
          {doItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Don&apos;t</p>
        <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-rose-950/80">
          {dontItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LogoVariantCard({ variant }: { variant: LogoVariant }) {
  return (
    <div
      className={`flex min-h-[180px] items-center justify-center px-6 py-8 sm:px-8 ${variant.backgroundClassName} ${variant.borderClassName || ""}`}
    >
      <div className="flex flex-nowrap items-center gap-3 sm:gap-4">
        <div className="relative h-10 w-10 shrink-0 sm:h-11 sm:w-11">
          <Image src="/logo.png" alt="Alpha Freight logo symbol" fill className="object-contain" />
        </div>
        <p
          className={`whitespace-nowrap text-xl font-bold leading-none tracking-[-0.08em] sm:text-2xl lg:text-[2.15rem] ${variant.textClassName}`}
        >
          ALPHA FREIGHT
        </p>
      </div>
    </div>
  );
}

export default function BrandKitPage() {
  const [activeTab, setActiveTab] = useState<BrandTab>("colors");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const resetCopy = useMemo(() => {
    return () => window.setTimeout(() => setCopiedHex(null), 1200);
  }, []);

  const handleCopy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      resetCopy();
    } catch {
      setCopiedHex(null);
    }
  };

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(query)),
      }))
      .filter((group) => group.items.length > 0);
  }, [searchQuery]);

  const meta = tabMeta[activeTab];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6 px-5 py-6 lg:sticky lg:top-0">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Alpha Freight</p>
                <p className="text-[11px] font-semibold text-slate-500">Brand Kit</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="space-y-6">
              {filteredGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <SidebarLink
                        key={item.id}
                        active={activeTab === item.id}
                        label={item.label}
                        onClick={() => setActiveTab(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-wrap gap-2">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
              >
                Docs
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
              >
                Website
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-h-screen bg-[#FDFDFD]">
          <div className={`bg-gradient-to-r ${meta.background} px-6 py-10 text-white sm:px-10`}>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div className="relative h-14 w-14 rounded-3xl border border-white/15 bg-white/10 p-3">
                  <Image src="/logo.png" alt="Alpha Freight" fill className="object-contain p-3" />
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight sm:text-4xl">{meta.title}</p>
                  <p className="mt-2 max-w-2xl text-sm font-medium text-white/70">
                    {meta.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/logo.png"
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black text-white transition hover:bg-white/15"
                >
                  <Download className="h-4 w-4" />
                  Download Logo
                </a>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:px-10">
            <div className="mb-10">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                {meta.headline}
              </p>
            </div>

            {activeTab === "colors" ? (
              <div className="space-y-14">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    Primary Colors
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500">
                    Primary colors define Alpha Freight’s premium identity. Use Alpha Lime as an
                    accent, not as a full background across the whole product.
                  </p>
                  <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {primaryColors.map((color) => (
                      <TallColorCard
                        key={color.hex}
                        color={color}
                        copied={copiedHex === color.hex}
                        onCopy={() => handleCopy(color.hex)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Neutral Colors
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500">
                    These neutral tones are perfect when you need something discreet and easy on the eye.
                    They pair well with the main palette and work great as backgrounds.
                  </p>
                  <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {neutralColors.map((color) => (
                      <NeutralSwatchCard key={color.hex} color={color} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Support Colors
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-500">
                    Use support colors for states and status messaging (success, warnings, errors,
                    and info). Keep them subtle and consistent.
                  </p>
                  <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {supportColors.map((color) => (
                      <TallColorCard
                        key={color.hex}
                        color={color}
                        copied={copiedHex === color.hex}
                        onCopy={() => handleCopy(color.hex)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "logo" ? (
              <div className="space-y-10">
                <div className="grid gap-6 lg:grid-cols-3">
                  {logoAssets.map((asset) => (
                    <div
                      key={asset.title}
                      className="px-4 py-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-black text-slate-900">
                          {asset.title}
                        </p>
                        <a
                          href={asset.file}
                          download
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                      <div className="mt-8 flex min-h-[260px] items-center justify-start pl-0 lg:pl-2">
                        <div className={`relative ${asset.previewClassName}`}>
                          <Image src={asset.file} alt={asset.title} fill className="object-contain" />
                        </div>
                      </div>
                      <div className="mt-6">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                          Usage Rule
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                          {asset.rule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-10 lg:pt-14">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Primary Lockup
                  </p>
                  <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:mt-16 sm:flex-row sm:items-center sm:justify-center sm:gap-7">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                      <Image src="/logo.png" alt="Alpha Freight Logo" fill className="object-contain" />
                    </div>
                    <p className="text-4xl font-bold tracking-[-0.08em] text-slate-900 sm:text-5xl lg:text-7xl">
                      ALPHA FREIGHT
                    </p>
                  </div>

                  <div className="mt-24 lg:mt-32">
                    <div className="w-[calc(100%+1.5rem)] -ml-1 sm:w-[calc(100%+3rem)] sm:-ml-4 lg:ml-[calc(50%-50vw+170px)] lg:w-[calc(100vw-360px)]">
                      <Image
                        src="/brand image 4.png"
                        alt="Alpha Freight brand typography system"
                        width={1792}
                        height={748}
                        className="h-auto w-full max-w-none object-contain"
                      />
                    </div>
                  </div>

                  <div className="mt-24 lg:mt-32">
                    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                      <div className="lg:pt-2">
                        <p className="text-3xl font-black tracking-tight text-slate-900">
                          Logo Variants
                        </p>
                      </div>
                      <div className="grid overflow-hidden lg:grid-cols-2">
                        {logoVariants.map((variant) => (
                          <LogoVariantCard key={variant.id} variant={variant} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-16">
                    <SectionCard eyebrow="Usage" title="Logo do not">
                      <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-slate-600">
                        {logoDonts.map((rule) => (
                          <li key={rule} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "typography" ? (
              <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <SectionCard eyebrow="Headings">
                    <p className="mt-5 text-5xl font-black tracking-tight text-slate-900">Alpha Freight</p>
                    <p className="mt-3 text-lg font-semibold text-slate-600">Premium freight operations</p>
                    <p className="mt-6 text-sm font-medium leading-7 text-slate-500">
                      Headlines should feel editorial and confident. Supporting copy stays calm and readable.
                    </p>
                  </SectionCard>
                  <SectionCard eyebrow="Buttons">
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-[#0B0F14] px-4 py-2 text-xs font-black text-white"
                      >
                        Primary Action
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700"
                      >
                        Secondary
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-[#BFFF07] px-4 py-2 text-xs font-black text-black"
                      >
                        Alpha Lime
                      </button>
                    </div>
                    <p className="mt-6 text-sm font-medium leading-7 text-slate-500">
                      Use Alpha Lime only for emphasis and key actions. Keep most buttons neutral.
                    </p>
                  </SectionCard>
                </div>

                <SectionCard eyebrow="Type scale" title="Hierarchy at a glance">
                  <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-[1fr_1fr_1fr_1.4fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      <p>Style</p>
                      <p>Size</p>
                      <p>Weight</p>
                      <p>Use</p>
                    </div>
                    {typeScale.map((row) => (
                      <div
                        key={row.name}
                        className="grid grid-cols-[1fr_1fr_1fr_1.4fr] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                      >
                        <p className="font-black text-slate-900">{row.name}</p>
                        <p className="font-medium text-slate-600">{row.size}</p>
                        <p className="font-medium text-slate-600">{row.weight}</p>
                        <p className="font-medium leading-6 text-slate-500">{row.use}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard eyebrow="Rules" title="Typography guidelines">
                  <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-slate-600">
                    {typographyRules.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFFF07]" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "tone" ? (
              <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  <SectionCard eyebrow="Voice" title="Senior logistics operator">
                    <ul className="mt-6 space-y-2 text-sm font-medium leading-7 text-slate-600">
                      <li>Be direct and practical — operators are busy.</li>
                      <li>Prefer steps and decisions over fluff.</li>
                      <li>Never invent numbers. Ask for missing inputs.</li>
                      <li>Keep tone premium, calm, and confident.</li>
                    </ul>
                  </SectionCard>
                  <SectionCard eyebrow="Examples">
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5">
                        <p className="text-xs font-black text-emerald-800">Good</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-emerald-950/80">
                          Share your route + equipment + rate. I will calculate effective RPM and
                          show the profit drivers.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-rose-200/60 bg-rose-50/60 p-5">
                        <p className="text-xs font-black text-rose-800">Bad</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-rose-950/80">
                          That sounds interesting. Many factors exist. Please consider different
                          options.
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <SectionCard eyebrow="Word choice" title="Use vs avoid">
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Use</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toneWords.use.map((word) => (
                          <span
                            key={word}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Avoid</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toneWords.avoid.map((word) => (
                          <span
                            key={word}
                            className="rounded-full border border-rose-200/70 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-900/80"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "introduction" ? (
              <div className="space-y-8">
                <SectionCard eyebrow="Overview" title="One source of truth for Alpha Freight">
                  <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                    This brand kit defines how Alpha Freight looks, reads, and feels across the website,
                    mobile app, sales materials, and partner communications. Use it before shipping new
                    UI, campaigns, or co-branded assets.
                  </p>
                </SectionCard>

                <div className="grid gap-6 lg:grid-cols-3">
                  {brandPillars.map((pillar) => (
                    <SectionCard key={pillar.title} eyebrow="Pillar" title={pillar.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{pillar.body}</p>
                    </SectionCard>
                  ))}
                </div>

                <SectionCard eyebrow="Quick links" title="Where this brand lives">
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Website", href: "/" },
                      { label: "Support", href: "/support" },
                      { label: "Directory", href: "/directory" },
                      { label: "Learning Series", href: "/learning-series" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-black text-slate-900 transition hover:bg-white"
                      >
                        {link.label}
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "mission" ? (
              <div className="space-y-8">
                <SectionCard eyebrow="Mission" title="Make freight operations simple and predictable">
                  <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                    Our mission is to reduce friction between suppliers and carriers with better
                    execution, transparent visibility, and AI support that performs actions — not
                    just answers questions.
                  </p>
                </SectionCard>

                <div className="grid gap-6 sm:grid-cols-2">
                  {brandValues.map((value) => (
                    <SectionCard key={value.title} eyebrow="Value" title={value.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{value.body}</p>
                    </SectionCard>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "website" ? (
              <div className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                  {websitePatterns.map((pattern) => (
                    <SectionCard key={pattern.title} eyebrow="Pattern" title={pattern.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{pattern.body}</p>
                      <Link
                        href={pattern.href}
                        className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        View live
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </SectionCard>
                  ))}
                </div>
                <SectionCard eyebrow="Preview" title="Marketing surface">
                  <div className="relative mt-6 h-[360px] w-full overflow-hidden rounded-3xl bg-slate-100">
                    <Image src="/demo%201.jpeg" alt="Website brand preview" fill className="object-cover" />
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "social" ? (
              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {socialTemplates.map((template) => (
                    <SectionCard key={template.title} eyebrow={template.ratio} title={template.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{template.body}</p>
                    </SectionCard>
                  ))}
                </div>
                <SectionCard eyebrow="Preview" title="Feed-ready composition">
                  <div className="relative mt-6 h-[360px] w-full overflow-hidden rounded-3xl bg-slate-100">
                    <Image src="/alpha-freight-hero.png" alt="Social media preview" fill className="object-cover" />
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "materials" ? (
              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {materialGuidelines.map((item) => (
                    <SectionCard key={item.title} eyebrow="Guideline" title={item.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{item.body}</p>
                    </SectionCard>
                  ))}
                </div>
                <SectionCard eyebrow="Logo usage" title="Do not">
                  <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-slate-600">
                    {logoDonts.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "illustration" ? (
              <div className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {illustrationPrinciples.map((item) => (
                    <SectionCard key={item.title} eyebrow="Principle" title={item.title}>
                      <p className="mt-4 text-sm font-medium leading-7 text-slate-600">{item.body}</p>
                    </SectionCard>
                  ))}
                </div>
                <SectionCard eyebrow="Examples" title="Approved visual direction">
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {illustrationExamples.map((example) => (
                      <div key={example.src}>
                        <div className="relative h-56 overflow-hidden rounded-2xl bg-slate-100">
                          <Image src={example.src} alt={example.alt} fill className="object-cover" />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-900">{example.caption}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "iconography" ? (
              <div className="space-y-8">
                <SectionCard eyebrow="System" title="Operational icon set">
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {iconographyItems.map((item) => {
                      const Icon = iconMap[item.name as keyof typeof iconMap];
                      return (
                        <div
                          key={item.name}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
                        >
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <Icon className="h-6 w-6 text-slate-900" strokeWidth={1.5} />
                          </div>
                          <p className="mt-3 text-sm font-black text-slate-900">{item.name}</p>
                          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{item.use}</p>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
                <SectionCard eyebrow="Rules" title="Icon usage">
                  <ul className="mt-5 space-y-3 text-sm font-medium leading-7 text-slate-600">
                    {iconographyRules.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFFF07]" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            ) : null}

            {activeTab === "photography" ? (
              <div className="space-y-8">
                <SectionCard eyebrow="Direction" title="Real ops, real freight">
                  <DoDontGrid doItems={photographyRules.do} dontItems={photographyRules.dont} />
                </SectionCard>
                <SectionCard eyebrow="Gallery" title="Approved photography">
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {photographyExamples.map((photo) => (
                      <div key={photo.src}>
                        <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-100">
                          <Image src={photo.src} alt={photo.title} fill className="object-cover" />
                        </div>
                        <p className="mt-3 text-sm font-black text-slate-900">{photo.title}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{photo.caption}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
