"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/utils/currency";
import type { ServiceCategory } from "@/types/domain";

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  daily: "#0F766E",
  monthly: "#2563EB",
  installment: "#7C3AED",
  online: "#F97316",
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  daily: "Daily",
  monthly: "Monthly",
  installment: "Installment",
  online: "Online",
};

export function ServiceCategoryChart({
  data,
}: {
  data: { category: ServiceCategory; amount: number }[];
}) {
  const chartData = data.map((entry) => ({
    name: CATEGORY_LABELS[entry.category],
    value: entry.amount,
    color: CATEGORY_COLORS[entry.category],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 13 }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
