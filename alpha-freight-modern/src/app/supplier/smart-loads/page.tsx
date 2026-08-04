"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Search, ArrowRight, Star, Clock } from "lucide-react";

export default function SupplierSmartLoads() {
  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-12 opacity-20 animate-pulse">
          <Zap size={200} className="text-blue-500" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20">
            AI-Powered Matching
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-6 leading-none">SMART LOADS<br />TECHNOLOGY.</h1>
          <p className="text-slate-400 text-lg font-medium mb-10 max-w-xl">Our advanced algorithm analyzes thousands of carriers to find the most reliable and cost-effective match for your specific freight requirements.</p>
          <button className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-4 shadow-xl shadow-blue-600/20">
            Find Matches
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Recent Matches</h3>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                  <Star className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 mb-1">Elite Carrier Group</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">98% Match Score • 4.9 Rating</p>
                </div>
                <button className="p-3 bg-white rounded-xl text-slate-300 group-hover:text-blue-600 transition-colors shadow-sm">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Matching Settings</h3>
          <div className="space-y-6">
            {[
              { label: 'Priority', value: 'Cost Efficiency', icon: <Clock /> },
              { label: 'Carrier Rating', value: '4.5+ Stars Only', icon: <Star /> },
              { label: 'Insurance', value: 'Verified $1M+', icon: <Shield /> }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  </div>
                </div>
                <button className="text-xs font-black text-blue-600 uppercase tracking-widest">Change</button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
