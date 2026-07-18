"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export type WorkflowStep = {
  step: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  timing: string;
};

export type PremiumWorkflowProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  steps: WorkflowStep[];
};

export default function PremiumWorkflowSteps({ eyebrow, title, subtitle, steps }: PremiumWorkflowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".workflow-header", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power4.out",
      });

      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.2,
            ease: "power3.inOut",
            scrollTrigger: { trigger: ".workflow-track", start: "top 80%" },
          },
        );
      }

      gsap.from(".workflow-step", {
        scrollTrigger: { trigger: ".workflow-track", start: "top 78%" },
        y: 56,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-b border-slate-200/70 bg-white py-24 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(191,255,7,0.08),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1800px] px-6 lg:px-12">
        <div className="workflow-header mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7da600]">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-[3.25rem] md:leading-[1.02]">
              {title}
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-slate-500">{subtitle}</p>
        </div>

        <div className="workflow-track relative">
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[2.75rem] hidden h-[2px] overflow-hidden xl:block">
            <div ref={lineRef} className="h-full w-full bg-gradient-to-r from-[#BFFF07]/20 via-[#BFFF07] to-[#BFFF07]/20" />
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  className="workflow-step group relative"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.05)] transition-all duration-500 group-hover:border-slate-300 group-hover:shadow-[0_24px_64px_rgba(15,23,42,0.1)] md:p-8">
                    <span className="pointer-events-none absolute -right-1 top-2 select-none text-[4.5rem] font-bold leading-none tracking-tighter text-slate-100">
                      {step.step}
                    </span>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#BFFF07] text-slate-900 shadow-[0_8px_24px_rgba(191,255,7,0.35)]">
                            <Icon className="h-5 w-5" />
                            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[9px] font-bold text-white">
                              {index + 1}
                            </span>
                          </span>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                          {step.timing}
                        </span>
                      </div>

                      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[#7da600]">
                        Step {step.step}
                      </p>
                      <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">{step.detail}</p>
                    </div>

                    <div className="pointer-events-none absolute inset-x-8 bottom-0 h-[3px] origin-left scale-x-0 rounded-full bg-[#BFFF07] transition-transform duration-500 group-hover:scale-x-100" />
                  </div>

                  {index < steps.length - 1 && (
                    <div className="absolute -right-3 top-11 z-20 hidden h-3 w-3 rounded-full border-[3px] border-white bg-[#BFFF07] shadow-[0_0_0_4px_rgba(191,255,7,0.2)] xl:block" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
