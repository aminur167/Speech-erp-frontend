import { clsx } from "clsx";
import type { Booking } from "@/types/domain";

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Same visual language as PatientTable's avatar circle — one identity marker, reused everywhere a patient appears in a list. */
export function PatientAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-dark",
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs",
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export function StatusDot({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={clsx("h-2 w-2 shrink-0 rounded-full", status === "cancelled" ? "bg-danger" : "bg-info")}
    />
  );
}
