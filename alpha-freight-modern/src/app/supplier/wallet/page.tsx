"use client";

import { motion } from "framer-motion";
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";

export default function SupplierWallet() {
  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Financial Overview</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">Manage your billing and payments</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Wallet size={160} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-4">Total Balance</p>
            <h2 className="text-5xl font-black tracking-tighter mb-8">$12,450.00</h2>
            <div className="flex gap-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Add Funds
              </button>
              <button className="bg-blue-500/30 text-white border border-blue-400/30 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-500/40 transition-colors">
                <History className="w-4 h-4" />
                Transactions
              </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full">MONTHLY SPEND</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Spending</p>
            <p className="text-2xl font-black text-slate-900">$4,230.50</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">PENDING</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pending Invoices</p>
            <p className="text-2xl font-black text-slate-900">$1,850.00</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
