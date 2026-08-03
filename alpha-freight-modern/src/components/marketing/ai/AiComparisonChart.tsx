"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildComparisonChartData,
  chartTitle,
  chartUnit,
  type PublicChartType,
} from "@/lib/public-ai-widgets";

type AiComparisonChartProps = {
  chartType: PublicChartType;
};

export default function AiComparisonChart({ chartType }: AiComparisonChartProps) {
  const data = buildComparisonChartData(chartType).map((d) => ({
    name: d.label,
    value: d.value,
  }));
  const unit = chartUnit(chartType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-gradient-to-b from-white to-[#fafafa] p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#7a9900]" />
        <p className="text-sm font-semibold text-[#0d0d0d]">{chartTitle(chartType)}</p>
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#999" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) => (chartType === "fuel" ? `£${v}` : chartType === "profit" ? `£${v}` : `£${v}`)}
            />
            <Tooltip
              formatter={(v) => [`${unit === "£/L" ? "£" : unit === "£/mi" ? "£" : "£"}${Number(v).toFixed(2)}${unit === "£/mi" ? "/mi" : unit === "£/L" ? "/L" : ""}`, chartTitle(chartType)]}
              contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 12 }}
            />
            <Bar dataKey="value" fill="#BFFF07" stroke="#7a9900" strokeWidth={1} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
