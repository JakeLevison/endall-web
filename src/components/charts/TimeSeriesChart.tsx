"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export default function TimeSeriesChart({
  data,
  color = "#3b82f6",
  height = 200,
  valuePrefix = "",
  valueSuffix = "",
}: TimeSeriesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-[13px] text-zinc-600">No data for this period</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#666" }}
          axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#666" }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => `${valuePrefix}${v.toLocaleString()}${valueSuffix}`}
        />
        <Tooltip
          contentStyle={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 12,
            color: "#ccc",
          }}
          formatter={(value) => [`${valuePrefix}${Number(value).toLocaleString()}${valueSuffix}`, "Value"]}
          labelStyle={{ color: "#888" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
