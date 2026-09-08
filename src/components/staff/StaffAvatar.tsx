import { clsx } from "clsx";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** A stable-per-name accent so a long roster still reads as distinct people at a glance, not a wall of identical teal circles. */
const ACCENTS = [
  "bg-primary-light text-primary-dark",
  "bg-info/10 text-info",
  "bg-status-refunded/10 text-status-refunded",
  "bg-warning/10 text-warning",
  "bg-success/10 text-success",
];

function accentFor(name: string): string {
  const hash = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACCENTS[hash % ACCENTS.length];
}

export function StaffAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        accentFor(name),
        size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-sm",
      )}
    >
      {getInitials(name)}
    </span>
  );
}
