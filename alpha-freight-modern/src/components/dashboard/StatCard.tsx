"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

export default function StatCard({ title, value, change, isPositive, icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-[#0f0f0f] border border-white/5 p-6 rounded-3xl transition-all duration-300 hover:border-[#BFFF07]/20 hover:shadow-[0_0_30px_rgba(191,255,7,0.05)]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#BFFF07]">
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
          isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        }`}>
          {isPositive ? "+" : ""}{change}%
        </div>
      </div>
      <div>
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
