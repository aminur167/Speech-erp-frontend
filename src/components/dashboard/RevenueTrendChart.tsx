"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/currency";

const PRIMARY = "#0F766E";
const BORDER = "#E2E8F0";
const TEXT_SECONDARY = "#64748B";

export function RevenueTrendChart({ data }: { data: { label: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip
          formatter={(value: unknown) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, borderColor: BORDER, fontSize: 13 }}
        />
        <Area type="monotone" dataKey="amount" stroke={PRIMARY} strokeWidth={2} fill="url(#revenueTrendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
