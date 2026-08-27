import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

type Tone = "primary" | "danger" | "warning" | "info" | "purple" | "success";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-light text-primary",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  purple: "bg-status-refunded/10 text-status-refunded",
  success: "bg-success/10 text-success",
};

export interface ActionItem {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
  onClick: () => void;
}

export function ActionCenterCard({ items }: { items: ActionItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04)]">
      <div className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-primary-light/40"
          >
            <div className={clsx("rounded-lg p-2.5", toneStyles[item.tone])}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {item.label}
              </p>
              <p className="text-lg font-semibold text-text-primary">{item.value}</p>
              <p className="truncate text-xs text-text-secondary">{item.hint}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" />
          </button>
        ))}
      </div>
    </div>
  );
}
