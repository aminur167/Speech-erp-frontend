import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";

const toneText = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
} as const;

/** A StatCard footer line: a colored trend chip plus optional plain context text. */
export function TrendFooter({
  trend,
  context,
  tone = "success",
  icon: Icon = ArrowUpRight,
}: {
  trend: string;
  context?: string;
  tone?: keyof typeof toneText;
  icon?: LucideIcon;
}) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className={clsx("inline-flex items-center gap-0.5 font-medium", toneText[tone])}>
        <Icon className="h-3 w-3" />
        {trend}
      </span>
      {context && <span className="text-text-secondary">{context}</span>}
    </p>
  );
}
