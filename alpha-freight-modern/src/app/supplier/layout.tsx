"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SupplierSidebar from "@/components/supplier/SupplierSidebar";
import { Menu, X, Bell, Search, Clock, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeedSidebar from "@/components/feed/FeedSidebar";
import ProfileExtrasHydrator from "@/components/platform/ProfileExtrasHydrator";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isFeedRoute = pathname.startsWith("/supplier/feed");
  const isCheckoutRoute = pathname.startsWith("/supplier/pay-instant");

  if (isCheckoutRoute) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  if (isFeedRoute) {
    return (
      <div className="min-h-screen bg-[#05070B] text-white lg:flex">
        <div className="sticky top-0 z-[80] flex items-center justify-between border-b border-white/6 bg-[#05070B] px-4 py-3 lg:hidden">
          <div>
            <p className="text-sm font-black tracking-tight text-white">Feed Workspace</p>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Supplier Community</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-xl border border-white/8 bg-white/5 p-2 text-slate-300"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className={`fixed inset-y-0 left-0 z-[90] transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
          <Suspense fallback={<div className="h-full w-[248px] bg-[#05070B]" />}>
            <FeedSidebar role="supplier" onClose={() => setIsSidebarOpen(false)} />
          </Suspense>
        </div>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1 lg:ml-[248px]">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans">
      <ProfileExtrasHydrator role="supplier" />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SupplierSidebar workspaceLabel="Supplier" />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-[100] lg:hidden shadow-2xl"
            >
              <SupplierSidebar
                onClose={() => setIsSidebarOpen(false)}
                workspaceLabel="Supplier"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-[#FDFDFD]/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
              <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search shipments, orders..." 
                className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-900 placeholder:text-slate-400 w-48 sm:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.05, y: -1 }} 
                className="cursor-pointer group p-1 rounded-xl hover:bg-slate-50 transition-all"
                title="Activity"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-transparent group-hover:border-blue-100 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05, y: -1 }} 
                className="cursor-pointer group p-1 rounded-xl hover:bg-slate-50 transition-all"
                title="Notifications"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-transparent group-hover:border-blue-100 shadow-sm relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/supplier/ai-assistant")}
                className="cursor-pointer group p-1 rounded-xl hover:bg-slate-100 transition-all"
                title="AI Assistant"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm shadow-slate-900/20 group-hover:bg-slate-800 transition-all">
                  <Sparkles className="w-4 h-4" />
                </div>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
