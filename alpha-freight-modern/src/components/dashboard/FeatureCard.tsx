"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export default function FeatureCard({ title, description, icon, badge }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.08)" }}
      className="bg-white border border-gray-100 p-6 rounded-xl hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="text-gray-400 group-hover:text-[#2563EB] transition-colors scale-110 mt-0.5">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
            {badge && (
              <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full leading-none">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
