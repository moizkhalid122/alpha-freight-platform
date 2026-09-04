import { notFound } from "next/navigation";
import PremiumIndustryPage from "@/components/marketing/PremiumIndustryPage";
import FoodIndustryPage from "@/components/marketing/FoodIndustryPage";
import PharmaceuticalsIndustryPage from "@/components/marketing/PharmaceuticalsIndustryPage";
import GeneralFreightIndustryPage from "@/components/marketing/GeneralFreightIndustryPage";
import AutomotiveIndustryPage from "@/components/marketing/AutomotiveIndustryPage";
import RetailIndustryPage from "@/components/marketing/RetailIndustryPage";
import IndustrySolutionPage from "@/components/marketing/IndustrySolutionPage";
import { createPageMetadata } from "@/lib/seo";
import {
  getIndustryBySlug,
  INDUSTRY_SLUGS,
  type IndustrySlug,
} from "@/lib/industry-content";
import { getPremiumTheme } from "@/lib/premium-industry-themes";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return INDUSTRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) return {};

  return createPageMetadata({
    title: industry.seo.title,
    description: industry.seo.description,
    path: industry.path,
    keywords: industry.seo.keywords,
  });
}

export default async function IndustryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);

  if (!industry) {
    notFound();
  }

  if (industry.slug === "food") {
    return <FoodIndustryPage content={industry} />;
  }

  if (industry.slug === "retail") {
    return <RetailIndustryPage content={industry} />;
  }

  if (industry.slug === "pharmaceuticals") {
    return <PharmaceuticalsIndustryPage content={industry} />;
  }

  if (industry.slug === "automotive") {
    return <AutomotiveIndustryPage content={industry} />;
  }

  if (industry.slug === "general-freight") {
    return <GeneralFreightIndustryPage content={industry} />;
  }

  const premiumTheme = getPremiumTheme(industry.slug);
  if (premiumTheme) {
    return <PremiumIndustryPage content={industry} theme={premiumTheme} />;
  }

  return <IndustrySolutionPage content={industry} />;
}

export type { IndustrySlug };
