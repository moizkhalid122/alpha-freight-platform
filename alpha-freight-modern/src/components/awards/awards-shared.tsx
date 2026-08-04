"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, animate, useScroll } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const AWARDS = {
  text: "text-slate-900",
  textMuted: "text-slate-500",
  accent: "text-[#3B82F6]",
  accentBg: "bg-[#3B82F6]",
  darkPanel: "bg-[#0a0a0a]",
} as const;

export function AnimatedCounter({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {String(display).padStart(2, "0")}
    </span>
  );
}

export function FloatingParticles({ count = 24 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    }))
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[#3B82F6]/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function BlackGlassPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0a0a0a] text-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.06)_0%,transparent_42%,rgba(59,130,246,0.06)_100%)]" />
      <div className="pointer-events-none absolute -left-1/4 top-0 h-1/2 w-1/2 rounded-full bg-[#3B82F6]/10 blur-[80px]" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 56, scale: 0.98, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function MouseGlow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
    >
      <motion.div
        className="pointer-events-none absolute h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/15 blur-3xl"
        style={{ left: x, top: y }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function SectionShell({
  id,
  children,
  className = "",
  eyebrow,
  title,
  subtitle,
  centered = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id={id} ref={ref} className={`relative isolate overflow-hidden bg-white py-24 sm:py-32 ${className}`}>
      <div className="relative z-[1] mx-auto max-w-[1320px] px-6 lg:px-10">
        {(eyebrow || title) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-14 max-w-3xl ${centered ? "mx-auto text-center" : ""}`}
          >
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#3B82F6]">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.06]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">{subtitle}</p>
            ) : null}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

export function GlassCard({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border backdrop-blur-md ${
        dark
          ? "border-white/[0.08] bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:border-[#3B82F6]/40 hover:shadow-[0_24px_80px_rgba(59,130,246,0.15)]"
          : "border-slate-200/80 bg-white/80 shadow-[0_8px_40px_rgba(15,23,42,0.05)]"
      } ${className}`}
    >
      {dark ? (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function MagneticButton({
  children,
  className = "",
  href,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 24 });
  const sy = useSpring(y, { stiffness: 260, damping: 24 });

  const handleMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      x.set((e.clientX - rect.left - rect.width / 2) * 0.14);
      y.set((e.clientY - rect.top - rect.height / 2) * 0.14);
    },
    [x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const inner = (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-shadow ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );

  if (href) return <a href={href} className="group inline-block">{inner}</a>;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="group inline-block disabled:cursor-not-allowed disabled:opacity-50">
      {inner}
    </button>
  );
}

export function AwardsPageSkeleton() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotateY: [0, 360], rotateX: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-lg"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/20" />
        </motion.div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Alpha Freight Awards</p>
      </div>
    </div>
  );
}

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return fine;
}

export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const finePointer = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(useTransform(rx, [-0.5, 0.5], [5, -5]), { stiffness: 180, damping: 26 });
  const rotateY = useSpring(useTransform(ry, [-0.5, 0.5], [-5, 5]), { stiffness: 180, damping: 26 });

  if (!finePointer) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        rx.set((e.clientY - rect.top) / rect.height - 0.5);
        ry.set((e.clientX - rect.left) / rect.width - 0.5);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className={`relative z-[1] transition-[z-index] duration-200 hover:z-20 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function DarkCenterBand({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <BlackGlassPanel className={className}>{children}</BlackGlassPanel>;
}

export function Trophy3D({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`relative mx-auto ${className}`}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      animate={{ rotateY: [0, 12, -12, 0], y: [0, -8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 shadow-[0_0_60px_rgba(59,130,246,0.25)] sm:h-32 sm:w-32">
        <svg viewBox="0 0 64 64" className="h-16 w-16 sm:h-20 sm:w-20" fill="none" aria-hidden>
          <path
            d="M32 8v8M22 16h20M24 16c0 8 3.5 14 8 18 4.5-4 8-10 8-18M32 34v6M26 48h12M28 54h8"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 20c-4 2-6 6-6 10 0 6 5 10 12 10M46 20c4 2 6 6 6 10 0 6-5 10-12 10"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="42" rx="10" ry="3" fill="#3B82F6" opacity="0.4" />
        </svg>
        <motion.div
          className="absolute inset-0 rounded-3xl border border-white/10"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

export function AwardsScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-[#3B82F6]"
      style={{ scaleX }}
    />
  );
}
