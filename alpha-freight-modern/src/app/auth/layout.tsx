"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import BrandMark from "@/components/BrandMark";

function AuthContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const bgImage = role === "supplier" ? "/alpha-box.jpg" : "/alpha freight truck.jpg";
  const isMarketingSignup =
    pathname === "/auth/supplier-signup" || pathname === "/auth/carrier-signup";

  if (isMarketingSignup) {
    return <>{children}</>;
  }

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
          <a
            href="/terms-of-service"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 underline decoration-slate-200 underline-offset-4"
          >
            Terms & Conditions
          </a>
        </div>
      </div>

      <div className="hidden min-h-[720px] flex-1 bg-[#F3F4F6] p-5 lg:block lg:min-h-[780px] lg:p-6">
        <div className="group relative h-full min-h-[660px] w-full overflow-hidden rounded-[32px] lg:min-h-[720px]">
          <motion.img
            key={bgImage}
            initial={{ opacity: 0.85, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={bgImage}
            alt="Alpha Freight"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/5" />
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutShell>{children}</AuthLayoutShell>
  );
}

function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingSignup =
    pathname === "/auth/supplier-signup" || pathname === "/auth/carrier-signup";

  if (isMarketingSignup) {
    return <div className="min-h-[100dvh] bg-black font-sans">{children}</div>;
  }

  return (
    <div className="flex min-h-[100dvh] justify-center bg-white font-sans sm:items-center sm:bg-[#E5E7EB] sm:p-6 md:p-8">
      <Suspense
        fallback={
          <div className="h-[min(780px,100dvh)] w-full max-w-[1200px] animate-pulse bg-white sm:rounded-3xl lg:rounded-[40px]" />
        }
      >
        <AuthContent>{children}</AuthContent>
      </Suspense>
    </div>
  );
}
