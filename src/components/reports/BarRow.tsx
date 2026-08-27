import { formatCurrency } from "@/utils/currency";

export function BarRow({
  label,
  amount,
  maxAmount,
}: {
  label: string;
  amount: number;
  maxAmount: number;
}) {
  const widthPercent = maxAmount > 0 ? Math.max(4, (amount / maxAmount) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-text-primary">{label}</span>
        <span className="font-medium text-text-primary">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}
