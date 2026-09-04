"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Shield, TrendingUp, Zap } from "lucide-react";
import Counter from "@/components/Counter";

const serif = () => "font-[family-name:var(--font-home-serif)]";

const heroStats = [
  { value: 500, suffix: "+", description: "verified UK carriers on the Alpha marketplace" },
  { value: 120, suffix: "+", description: "loads matched daily across live UK lanes" },
  { value: 7, suffix: " days", description: "carrier payout window after verified delivery" },
  { value: 11, suffix: "", description: "free freight tools for suppliers and carriers" },
];

const features = [
  {
    icon: Zap,
    title: "Get loads live faster.",
    description:
      "Post routes, set pricing, and publish to verified carriers in minutes — with live map preview and instant payment flow.",
    href: "/post-loads",
    cta: "Post a load",
  },
  {
    icon: TrendingUp,
    title: "Grow freight revenue.",
    description:
      "Collect competitive bids, track margins, and settle payouts in 7 days — without broker retainers or hidden fees.",
    href: "/pricing",
    cta: "View pricing",
  },
  {
    icon: Shield,
    title: "Manage delivery risk.",
    description:
      "Verified carriers, live GPS tracking, digital POD, and compliance checks keep every shipment auditable end to end.",
    href: "/products/tracking",
    cta: "Explore tracking",
  },
];

export default function HomePlatformShowcase() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_center_bottom,rgba(120,113,108,0.07),transparent_72%)]" />
      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-10">
        <p className="home-fade text-center text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">
          Platform scale
        </p>
        <h2
          className={`home-fade mx-auto mt-5 max-w-[820px] text-center text-[clamp(2.25rem,4.5vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.015em] text-neutral-900 ${serif()}`}
        >
          The backbone of UK freight
        </h2>

        <div className="home-fade mx-auto mt-16 max-w-[1080px] border-t border-neutral-200" />

        <div className="mt-16 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {heroStats.map((stat, index) => (
            <div
              key={stat.description}
              className={`home-fade text-center lg:px-8 lg:text-left ${index > 0 ? "lg:border-l lg:border-neutral-200/80" : ""}`}
            >
              <p
                className={`text-[clamp(2.25rem,3.6vw,3.125rem)] font-medium leading-none tracking-[-0.02em] text-neutral-900 ${serif()}`}
              >
                <Counter value={stat.value} suffix={stat.suffix} duration={2} />
              </p>
              <p className="mx-auto mt-5 max-w-[220px] text-[13px] font-light leading-[1.75] tracking-[0.01em] text-neutral-500 lg:mx-0">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="home-fade mx-auto mt-16 max-w-[1080px] border-t border-neutral-200 lg:mt-20" />

        <div className="home-fade grid gap-10 pt-16 lg:grid-cols-[1fr_0.88fr] lg:items-start lg:gap-20 lg:pt-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-neutral-400">Supplier platform</p>
            <h2
              className={`mt-5 max-w-[540px] text-[clamp(2.125rem,3.8vw,3.375rem)] font-medium leading-[1.06] tracking-[-0.015em] text-neutral-900 ${serif()}`}
            >
              Make your freight operation a complete logistics platform
            </h2>
            <Link
              href="/auth/signup?role=supplier"
              className="mt-9 inline-flex h-[46px] items-center gap-1.5 rounded-full border border-neutral-900 bg-neutral-900 px-7 text-[13px] font-medium tracking-[-0.01em] text-white transition hover:bg-neutral-800"
            >
              Alpha Freight for suppliers
              <ChevronRight className="h-4 w-4 opacity-80" />
            </Link>
          </div>
          <p className="max-w-[440px] text-[15px] font-light leading-[1.8] tracking-[0.01em] text-neutral-500 lg:pt-2">
            From independent hauliers to growing UK suppliers, teams use Alpha Freight to post loads, collect verified
            bids, track every mile, and pay carriers with confidence — all in one workspace.
          </p>
        </div>

        <div className="home-fade mt-14 overflow-hidden rounded-2xl ring-1 ring-neutral-200/80 sm:mt-16 lg:rounded-[1.25rem]">
          <Image
            src="/images/home/platform-post-load.png"
            alt="Alpha Freight supplier dashboard — post a load with route map, cargo details, and live tracking"
            width={1920}
            height={1080}
            className="h-auto w-full object-contain object-center"
            priority={false}
          />
        </div>

        <div className="home-fade mx-auto mt-16 max-w-[1080px] border-t border-neutral-200 lg:mt-20" />

        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-0">
          {features.map(({ icon: Icon, title, description, href, cta }, index) => (
            <div
              key={title}
              className={`home-fade lg:px-8 ${index > 0 ? "lg:border-l lg:border-neutral-200/80" : ""}`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-800">
                <Icon className="h-[16px] w-[16px]" strokeWidth={1.5} />
              </div>
              <h3 className={`mt-6 text-[1.125rem] font-medium leading-snug tracking-[-0.015em] text-neutral-900 ${serif()}`}>
                {title}
              </h3>
              <p className="mt-3 max-w-[300px] text-[13px] font-light leading-[1.75] tracking-[0.01em] text-neutral-500">
                {description}
              </p>
              <Link
                href={href}
                className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-900 transition hover:gap-2.5"
              >
                {cta}
                <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
