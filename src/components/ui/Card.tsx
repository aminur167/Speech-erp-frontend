import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

const paddingStyles = {
  sm: "p-5",
  md: "p-6",
} as const;

export function Card({
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: keyof typeof paddingStyles }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04)]",
        paddingStyles[padding],
        className,
      )}
      {...props}
    />
  );
}
