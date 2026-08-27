"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/currency";
import type { PaymentMethod } from "@/types/domain";

const PRIMARY = "#0F766E";
const BORDER = "#E2E8F0";
const TEXT_SECONDARY = "#64748B";

function toLabel(method: PaymentMethod): string {
  const spaced = method.replace("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function RevenueByMethodChart({
  data,
}: {
  data: { method: PaymentMethod; amount: number }[];
}) {
  const chartData = data.map((entry) => ({ label: toLabel(entry.method), amount: entry.amount }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Bar dataKey="amount" fill={PRIMARY} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
