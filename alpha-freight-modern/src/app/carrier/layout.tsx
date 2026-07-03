"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ProfileExtrasHydrator from "@/components/platform/ProfileExtrasHydrator";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FeedSidebar from "@/components/feed/FeedSidebar";

export default function CarrierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isCleanFlowRoute = pathname.startsWith("/carrier/wallet/payout-setup");
  const isFeedRoute = pathname.startsWith("/carrier/feed");

  if (isCleanFlowRoute) {
    return <>{children}</>;
  }

  if (isFeedRoute) {
    return (
      <div className="min-h-screen bg-[#05070B] text-white lg:flex">
        <div className="sticky top-0 z-[80] flex items-center justify-between border-b border-white/6 bg-[#05070B] px-4 py-3 lg:hidden">
          <div>
            <p className="text-sm font-black tracking-tight text-white">Feed Workspace</p>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Carrier Community</p>
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
            <FeedSidebar role="carrier" onClose={() => setIsSidebarOpen(false)} />
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
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 flex flex-col lg:flex-row">
      <ProfileExtrasHydrator role="carrier" />
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#FDFDFD] border-b border-gray-100 sticky top-0 z-[60]">


        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">Alpha Freight</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <DashboardSidebar
          onClose={() => setIsSidebarOpen(false)}
          workspaceLabel="Carrier"
        />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-[#FDFDFD]">
        {children}
      </div>
    </div>
  );
}
