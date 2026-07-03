"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X, Calendar, Clock as ClockIcon, Users } from "lucide-react";
import { Suspense } from "react";

function AuthContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  // Determine which image to show based on role
  const bgImage = role === "supplier" ? "/alpha-box.jpg" : "/alpha freight truck.jpg";

  return (
    <div className="w-full max-w-[1200px] h-full max-h-[850px] bg-[#F3F4F6] rounded-[40px] shadow-2xl overflow-hidden flex relative">
      
      {/* Left Side: Form Area */}
      <div className="w-full lg:w-[45%] p-8 md:p-12 flex flex-col justify-between relative bg-gradient-to-br from-white/40 to-transparent">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="px-6 py-2 border border-slate-300 rounded-full text-sm font-semibold text-slate-600 hover:bg-white transition-all shadow-sm">
            Alpha Freight
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-[380px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-widest px-2">
          <p>© 2026 Alpha Freight</p>
          <Link href="#" className="hover:text-slate-600 underline decoration-slate-200 underline-offset-4">Terms & Conditions</Link>
        </div>
      </div>

      {/* Right Side: Image & Interactive UI (Crextio Style) */}
      <div className="hidden lg:block flex-1 p-4">
        <div className="w-full h-full rounded-[32px] relative overflow-hidden group">
          {/* Background Image: Dynamic based on role */}
          <motion.img 
            key={bgImage}
            initial={{ opacity: 0.8, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={bgImage} 
            alt="Alpha Freight Background"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-500" />
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#D1D5DB] flex items-center justify-center p-4 md:p-8 font-sans">
      <Suspense fallback={<div className="w-full max-w-[1200px] h-[850px] bg-white/50 animate-pulse rounded-[40px]" />}>
        <AuthContent>{children}</AuthContent>
      </Suspense>
    </div>
  );
}

