"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/air-dashboard";

type AirDashboardChartProps = {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  valuePrefix?: string;
  accent?: string;
};

const PERIODS = [
  { key: "3m", months: 3, label: "3M" },
  { key: "6m", months: 6, label: "6M" },
] as const;

export default function AirDashboardChart({
  title,
  subtitle,
  data,
  valuePrefix = "£",
  accent = "#0ea5e9",
}: AirDashboardChartProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("6m");

  const chartData = useMemo(() => {
    const months = PERIODS.find((item) => item.key === period)?.months ?? 6;
    return data.slice(-months);
  }, [data, period]);

  const total = chartData.reduce((acc, point) => acc + point.value, 0);

  return (
    <section className="air-card rounded-[28px] p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="air-font-display text-2xl font-medium text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === item.key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Period total:{" "}
        <span className="font-semibold text-slate-900">
          {valuePrefix}
          {total.toLocaleString("en-GB", { minimumFractionDigits: 0 })}
        </span>
      </p>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="airChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${valuePrefix}${value}`}
            />
            <Tooltip
              formatter={(value) => [
                `${valuePrefix}${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`,
                title,
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={accent}
              strokeWidth={2}
              fill="url(#airChartFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
