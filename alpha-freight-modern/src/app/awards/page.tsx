"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { AwardsPageSkeleton, AwardsScrollProgress } from "@/components/awards/awards-shared";
import { AwardsHero } from "@/components/awards/AwardsHero";
import { useMarketingSmoothScroll } from "@/hooks/useMarketingSmoothScroll";
import { AWARDS_EVENT, AWARDS_FAQ } from "@/lib/awards-content";

const AwardsAbout = dynamic(() => import("@/components/awards/AwardsAbout").then((m) => m.AwardsAbout));
const AwardsStatement = dynamic(() =>
  import("@/components/awards/AwardsStatement").then((m) => m.AwardsStatement)
);
const AwardsCategories = dynamic(() =>
  import("@/components/awards/AwardsCategories").then((m) => m.AwardsCategories)
);
const AwardsSelection = dynamic(() =>
  import("@/components/awards/AwardsSelection").then((m) => m.AwardsSelection)
);
const AwardsRewards = dynamic(() => import("@/components/awards/AwardsRewards").then((m) => m.AwardsRewards));
const AwardsTrustSeal = dynamic(() =>
  import("@/components/awards/AwardsTrustSeal").then((m) => m.AwardsTrustSeal)
);
const AwardsHallOfFame = dynamic(() =>
  import("@/components/awards/AwardsHallOfFame").then((m) => m.AwardsHallOfFame)
);
const AwardsSchedule = dynamic(() =>
  import("@/components/awards/AwardsSchedule").then((m) => m.AwardsSchedule)
);
const AwardsSponsors = dynamic(() =>
  import("@/components/awards/AwardsSponsors").then((m) => m.AwardsSponsors)
);
const AwardsTestimonials = dynamic(() =>
  import("@/components/awards/AwardsTestimonials").then((m) => m.AwardsTestimonials)
);
const AwardsFaq = dynamic(() => import("@/components/awards/AwardsFaq").then((m) => m.AwardsFaq));
const AwardsRegister = dynamic(() =>
  import("@/components/awards/AwardsRegister").then((m) => m.AwardsRegister)
);
const AwardsFinalCta = dynamic(() =>
  import("@/components/awards/AwardsFinalCta").then((m) => m.AwardsFinalCta)
);

function SectionFallback() {
  return <div className="mx-auto h-40 max-w-[1320px] animate-pulse rounded-2xl bg-slate-100 px-6" />;
}

export default function AwardsPage() {
  useMarketingSmoothScroll();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return <AwardsPageSkeleton />;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-[#3B82F6]/20 selection:text-slate-900">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: AWARDS_EVENT.title,
          startDate: AWARDS_EVENT.dateIso,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: AWARDS_EVENT.city,
            address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
          },
          description: AWARDS_EVENT.subheadline,
          organizer: { "@type": "Organization", name: "Alpha Freight", url: "https://www.alphafreightuk.com" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: AWARDS_FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />

      <AwardsScrollProgress />
      <Navbar variant="dark" />

      <main className="relative">
        <AwardsHero />
        <Suspense fallback={<SectionFallback />}>
          <AwardsAbout />
        </Suspense>
        <AwardsStatement />
        <Suspense fallback={<SectionFallback />}>
          <AwardsCategories />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsSelection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsRewards />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsTrustSeal />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsHallOfFame />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsSchedule />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsSponsors />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsTestimonials />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsFaq />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AwardsRegister />
        </Suspense>
        <AwardsFinalCta />
      </main>

      <Footer />
    </div>
  );
}
