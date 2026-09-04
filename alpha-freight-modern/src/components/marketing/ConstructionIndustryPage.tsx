"use client";

import PremiumIndustryPage from "@/components/marketing/PremiumIndustryPage";
import type { IndustryContent } from "@/lib/industry-content";
import { PREMIUM_INDUSTRY_THEMES } from "@/lib/premium-industry-themes";

export default function ConstructionIndustryPage({ content }: { content: IndustryContent }) {
  return <PremiumIndustryPage content={content} theme={PREMIUM_INDUSTRY_THEMES.construction} />;
}
