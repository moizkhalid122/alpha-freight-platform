"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Car,
  Package,
  Pill,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { IndustryIconKey } from "@/lib/industry-content";

export const INDUSTRY_ICON_MAP: Record<IndustryIconKey, LucideIcon> = {
  building: Building2,
  shopping: ShoppingBag,
  utensils: UtensilsCrossed,
  pill: Pill,
  car: Car,
  package: Package,
};

export function getIndustryIcon(key: IndustryIconKey): LucideIcon {
  return INDUSTRY_ICON_MAP[key];
}
