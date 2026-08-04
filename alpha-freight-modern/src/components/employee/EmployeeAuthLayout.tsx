"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import BrandMark from "@/components/BrandMark";

function EmployeeAuthContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex w-full max-w-[1200px] overflow-hidden bg-white shadow-none sm:min-h-[720px] sm:rounded-3xl sm:bg-[#F3F4F6] sm:shadow-xl lg:min-h-[780px] lg:rounded-[40px] lg:shadow-2xl">
      <div className="flex min-h-[100dvh] w-full flex-col bg-white sm:min-h-[720px] lg:min-h-[780px] lg:w-[45%] lg:bg-gradient-to-br lg:from-white lg:to-slate-50/80">
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-7 flex justify-center sm:mb-8 lg:mb-10">
              <BrandMark
                href="/"
                className="justify-center"
                iconClassName="h-8 w-8 sm:h-9 sm:w-9"
                textClassName="text-base font-bold tracking-tight text-slate-900 sm:text-lg"
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden shrink-0 items-center justify-between border-t border-slate-100 px-8 py-5 sm:flex lg:px-10 lg:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">© 2026 Alpha Freight</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Employee Hub · Private</p>
        </div>
      </div>

      <div className="hidden min-h-[720px] flex-1 bg-[#F3F4F6] p-5 lg:block lg:min-h-[780px] lg:p-6">
        <div className="group relative h-full min-h-[660px] w-full overflow-hidden rounded-[32px] lg:min-h-[720px]">
          <motion.img
            initial={{ opacity: 0.85, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src="/employee-auth-hero.jpg"
            alt="Alpha Freight employee team"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FFD666]">Team workspace</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Sales & operations hub</h2>
            <p className="mt-2 max-w-sm text-sm font-medium text-white/80">
              Track leads, calls, commission, and training — built for the Alpha Freight team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-white font-sans sm:items-center sm:bg-[#E5E7EB] sm:p-6 md:p-8">
      <Suspense
        fallback={
          <div className="h-[min(780px,100dvh)] w-full max-w-[1200px] animate-pulse bg-white sm:rounded-3xl lg:rounded-[40px]" />
        }
      >
        <EmployeeAuthContent>{children}</EmployeeAuthContent>
      </Suspense>
    </div>
  );
}
