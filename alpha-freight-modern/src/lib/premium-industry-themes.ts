import type { IndustrySlug } from "@/lib/industry-content";

export type PremiumIndustryTheme = {
  accent: string;
  accentDeep: string;
  accentSoft: string;
  accentMuted: string;
  milestoneCard: string;
  milestoneCardHover: string;
  milestoneBg: string;
  showcaseBlack: string;
  blackGlow: string;
  selectionBg: string;
};

export const PREMIUM_INDUSTRY_THEMES: Record<"construction" | "food", PremiumIndustryTheme> = {
  construction: {
    accent: "#E8A838",
    accentDeep: "#C8872E",
    accentSoft: "#FFF9F3",
    accentMuted: "#F5E8D6",
    milestoneCard: "#E8E4DD",
    milestoneCardHover: "#E2DDD6",
    milestoneBg: "#F9F8F6",
    showcaseBlack: "#0B0B0B",
    blackGlow: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(232,168,56,0.14), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(255,255,255,0.04), transparent 55%)",
    selectionBg: "#F5E8D6",
  },
  food: {
    accent: "#6B9E7A",
    accentDeep: "#3F6B52",
    accentSoft: "#F4FAF6",
    accentMuted: "#D6E8DC",
    milestoneCard: "#E0EBE4",
    milestoneCardHover: "#D5E0DA",
    milestoneBg: "#F6FAF8",
    showcaseBlack: "#0A0F0C",
    blackGlow: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(107,158,122,0.16), transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(255,255,255,0.04), transparent 55%)",
    selectionBg: "#D6E8DC",
  },
};

export function getPremiumTheme(slug: IndustrySlug): PremiumIndustryTheme | null {
  if (slug === "construction") return PREMIUM_INDUSTRY_THEMES.construction;
  return null;
}
