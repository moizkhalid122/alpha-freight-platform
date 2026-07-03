"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Truck, Building2, ChevronRight } from "lucide-react";

export default function SelectAccountPage() {
  return (
    <div className="w-full">
      <div className="mb-12">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Choose Account</h2>
        <p className="text-slate-500 font-medium text-sm">Select the type of account you want to access.</p>
      </div>

      <div className="space-y-8">
        {/* Carrier Option */}
        <Link href="/auth/login?role=carrier" className="block group">
          <div className="flex items-center gap-6 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD666] flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Truck className="w-8 h-8 text-slate-900" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Carrier Account</h3>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-slate-400 font-semibold mt-1">Manage your fleet and accept loads</p>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="h-px bg-slate-200 w-full opacity-50" />

        {/* Supplier Option */}
        <Link href="/auth/login?role=supplier" className="block group">
          <div className="flex items-center gap-6 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-yellow-600 transition-colors">Supplier Account</h3>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-slate-400 font-semibold mt-1">Post your freight and track shipments</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-100">
        <p className="text-center text-[13px] font-medium text-slate-500">
          New to Alpha Freight? <Link href="/auth/signup" className="text-slate-900 font-bold hover:underline underline-offset-4 tracking-tight uppercase text-[11px]">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
