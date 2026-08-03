"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATA = [
  { week: "W1", price: 1.47 },
  { week: "W2", price: 1.49 },
  { week: "W3", price: 1.52 },
  { week: "W4", price: 1.5 },
  { week: "W5", price: 1.53 },
  { week: "W6", price: 1.51 },
];

export default function AiFuelChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-gradient-to-b from-white to-[#fafafa] p-4 shadow-sm"
    >
      <p className="mb-1 text-sm font-semibold text-[#0d0d0d]">UK diesel trend (illustrative)</p>
      <p className="mb-3 text-xs text-[#888]">£/litre · recent weekly average · check RAC for live rate</p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BFFF07" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#BFFF07" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[1.44, 1.56]}
              tick={{ fontSize: 11, fill: "#999" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `£${v}`}
              width={42}
            />
            <Tooltip
              formatter={(v) => [`£${Number(v).toFixed(2)}/L`, "Diesel"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#7a9900"
              strokeWidth={2}
              fill="url(#fuelGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
