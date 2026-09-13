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

/** A staff member's photo when they have one, falling back to initials in a name-hashed accent color otherwise — never a broken image, never a blank circle. */
export function StaffAvatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a client-produced data URL, not something next/image's optimizer can process.
      <img
        src={photoUrl}
        alt={name}
        className={clsx("shrink-0 rounded-full border border-border object-cover", dimensions)}
      />
    );
  }

  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        accentFor(name),
        dimensions,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
