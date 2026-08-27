import type { LucideIcon } from "lucide-react";
import { Clock, CalendarDays, Layers, Globe } from "lucide-react";
import type { ServiceCategory } from "@/types/domain";

const CATEGORY_OPTIONS: {
  value: ServiceCategory;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "daily",
    label: "Daily Services",
    description: "Single-visit sessions billed per visit.",
    icon: Clock,
  },
  {
    value: "monthly",
    label: "Monthly Services",
    description: "Recurring monthly packages.",
    icon: CalendarDays,
  },
  {
    value: "installment",
    label: "Installment Services",
    description: "Paid in scheduled installments.",
    icon: Layers,
  },
  {
    value: "online",
    label: "Online Services",
    description: "Delivered remotely or booked online.",
    icon: Globe,
  },
];

export function ServiceCategoryPicker({
  onSelect,
}: {
  onSelect: (category: ServiceCategory) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CATEGORY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className="flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-light/40"
        >
          <div className="rounded-lg bg-primary-light p-2 text-primary">
            <option.icon className="h-5 w-5" />
          </div>
          <p className="font-medium text-text-primary">{option.label}</p>
          <p className="text-xs text-text-secondary">{option.description}</p>
        </button>
      ))}
    </div>
  );
}
