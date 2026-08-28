import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";

type Tone = "primary" | "danger" | "warning" | "info" | "purple" | "success";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-light text-primary",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  purple: "bg-status-refunded/10 text-status-refunded",
  success: "bg-success/10 text-success",
};

export const toneAccentColor: Record<Tone, string> = {
  primary: "#0F766E",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
  purple: "#7C3AED",
  success: "#16A34A",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  chart,
  footer,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
  chart?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
        {Icon && (
          <div className={clsx("rounded-lg p-2", toneStyles[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
      {chart}
      {footer}
    </>
  );

  const accentStyle = { borderTopColor: toneAccentColor[tone], borderTopWidth: 3 };

  if (!onClick) {
    return (
      <Card className="flex flex-col gap-3" style={accentStyle}>
        {content}
      </Card>
    );
  }

  return (
    <Card
      className={clsx(
        "flex flex-col gap-3 text-left transition-shadow",
        "cursor-pointer hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
      style={accentStyle}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {content}
    </Card>
  );
}
