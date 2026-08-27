import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
