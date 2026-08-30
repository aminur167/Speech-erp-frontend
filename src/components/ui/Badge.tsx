import { clsx } from "clsx";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

const toneStyles: Record<Tone, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  danger: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger" },
  info: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  neutral: { bg: "bg-text-secondary/10", text: "text-text-secondary", dot: "bg-text-secondary" },
  purple: {
    bg: "bg-status-refunded/10",
    text: "text-status-refunded",
    dot: "bg-status-refunded",
  },
};

export function Badge({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  const styles = toneStyles[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        styles.bg,
        styles.text,
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}
