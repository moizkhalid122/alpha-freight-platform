"use client";

import Image from "next/image";
import { motion, useAnimationFrame, useInView, useMotionValue } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { AWARDS_EVENT, EVENT_EXPERIENCE } from "@/lib/awards-content";

const LOOP_DURATION_MS = 38000;

function ExperienceCard({ item }: { item: (typeof EVENT_EXPERIENCE)[number] }) {
  return (
    <article
      style={{ backgroundColor: item.bg }}
      className="flex h-[460px] w-[280px] shrink-0 flex-col rounded-2xl px-7 py-8 sm:h-[480px] sm:w-[300px] lg:w-[320px]"
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {item.time} · {item.title}
      </p>

      <div className="flex flex-1 items-center justify-center py-6">
        <div className="relative h-40 w-full overflow-hidden rounded-[1.25rem] shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:h-44">
          <Image src={item.image} alt={item.title} fill sizes="280px" className="object-cover" />
        </div>
      </div>

      <p className="text-center text-sm leading-relaxed text-slate-600">{item.desc}</p>
    </article>
  );
}

function EventMarquee({ items }: { items: (typeof EVENT_EXPERIENCE)[number][] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [halfWidth, setHalfWidth] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const measure = () => {
      setHalfWidth(node.scrollWidth / 2);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    const images = node.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure);
    });

    return () => observer.disconnect();
  }, [items]);

  useAnimationFrame((_, delta) => {
    if (pausedRef.current || halfWidth <= 0) return;

    const speed = halfWidth / LOOP_DURATION_MS;
    let next = x.get() - speed * delta;

    if (next <= -halfWidth) {
      next += halfWidth;
    }

    x.set(next);
  });

  return (
    <motion.div
      ref={trackRef}
      style={{ x }}
      className="flex w-max flex-nowrap gap-5"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      {items.map((item, index) => (
        <ExperienceCard key={`${item.title}-${index}`} item={item} />
      ))}
    </motion.div>
  );
}

export function AwardsSchedule() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const loopItems = useMemo(() => [...EVENT_EXPERIENCE, ...EVENT_EXPERIENCE], []);

  return (
    <section id="event-experience" ref={ref} className="relative isolate overflow-hidden bg-white py-24 sm:py-32">
      <div className="relative z-[1] mx-auto max-w-[1320px] px-6 text-center lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3B82F6]">Event experience</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.06]">
            An evening built for UK logistics leaders
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            {AWARDS_EVENT.city} · {AWARDS_EVENT.displayDate}
          </p>
        </motion.div>
      </div>

      <div className="relative z-[1] mt-14 w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-16 bg-gradient-to-r from-white to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-16 bg-gradient-to-l from-white to-transparent sm:w-24" />
        <EventMarquee items={loopItems} />
      </div>
    </section>
  );
}
