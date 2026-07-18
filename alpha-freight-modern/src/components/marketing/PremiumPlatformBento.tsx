"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.005, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

function PremiumCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className={`bento-card group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow] duration-500 hover:border-slate-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#BFFF07]/10 blur-3xl" />
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-[#BFFF07] shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

export type PlatformBentoProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  hero: {
    icon: LucideIcon;
    title: string;
    description: string;
    image: string;
    preview: ReactNode;
  };
  cards: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
    preview: ReactNode;
    className?: string;
    href?: string;
    linkLabel?: string;
  }>;
};

export default function PremiumPlatformBento({ eyebrow, title, subtitle, hero, cards }: PlatformBentoProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".bento-header", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        y: 32,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: "power4.out",
      });

      gsap.from(".bento-card", {
        scrollTrigger: { trigger: ".bento-grid", start: "top 82%" },
        y: 48,
        opacity: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const HeroIcon = hero.icon;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-slate-200/70 bg-[#fafafa] py-24 md:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(191,255,7,0.14),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f172a06_1px,transparent_1px),linear-gradient(to_bottom,#0f172a06_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_30%,#000_35%,transparent_100%)]" />

      <div className="relative mx-auto max-w-[1800px] px-6 lg:px-12">
        <div className="bento-header mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7da600]">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-[3.25rem] md:leading-[1.02]">
              {title}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-7 text-slate-500">{subtitle}</p>
        </div>

        <div className="bento-grid grid auto-rows-[minmax(180px,auto)] gap-5 md:grid-cols-12">
          <PremiumCard className="md:col-span-6 md:row-span-2 lg:col-span-5">
            <div className="flex h-full flex-col p-6 sm:p-8">
              <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100">
                <div className="relative aspect-[16/10]">
                  <Image src={hero.image} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                </div>
              </div>
              <IconBadge icon={HeroIcon} />
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{hero.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-[15px]">{hero.description}</p>
              <div className="mt-6">{hero.preview}</div>
            </div>
          </PremiumCard>

          {cards.map((card) => {
            const CardIcon = card.icon;
            const inner = (
              <PremiumCard className={`h-full ${card.className ?? ""}`}>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <IconBadge icon={CardIcon} />
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                  <div className="mt-5 flex-1">{card.preview}</div>
                  {card.href && card.linkLabel && (
                    <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-800 transition-colors group-hover:text-[#7da600]">
                      {card.linkLabel}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              </PremiumCard>
            );

            return card.href ? (
              <Link key={card.title} href={card.href} className={`block ${card.className ?? ""}`}>
                {inner}
              </Link>
            ) : (
              <div key={card.title} className={card.className}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
