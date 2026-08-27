import { clsx } from "clsx";

const SIZES = {
  sm: "h-9 w-9 rounded-md",
  md: "h-14 w-14 rounded-lg",
  lg: "h-full w-full rounded-lg",
} as const;

/**
 * Product image for a material. Falls back to the shared placeholder art when a
 * material has no photo, so table rows and product cards never collapse.
 *
 * Plain <img> rather than next/image: uploaded photos arrive as data URLs, which
 * the image optimizer can't process.
 *
 * `fit` is applied via inline style rather than an `object-contain`/`object-cover`
 * class so a caller's override always wins deterministically — Tailwind's utility
 * generation order isn't guaranteed to match a class string's left-to-right order,
 * so two conflicting object-fit classes here would be a silent toss-up.
 */
export function MaterialThumb({
  src,
  alt,
  size = "sm",
  fit = "cover",
  bordered = true,
  className,
}: {
  src?: string;
  alt: string;
  size?: keyof typeof SIZES;
  fit?: "cover" | "contain";
  bordered?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/materials/placeholder.svg"}
      alt={alt}
      style={{ objectFit: fit }}
      className={clsx(
        "shrink-0 bg-background",
        bordered && "border border-border",
        SIZES[size],
        className,
      )}
    />
  );
}
