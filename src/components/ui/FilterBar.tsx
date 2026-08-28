import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

/** Consistent width for every filter field inside a FilterBar, so dropdowns line up evenly. */
export const FILTER_FIELD_WIDTH = "w-full sm:w-40 shrink-0";

/**
 * Standard admin filter toolbar: a "Filters" label, equal-width filter fields flowing from the
 * left, and an optional date picker pinned to the far right via `dateSlot`.
 */
export function FilterBar({ children, dateSlot }: { children: ReactNode; dateSlot?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5 text-text-secondary">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
        </div>
        {children}
        {dateSlot && <div className="ml-auto shrink-0">{dateSlot}</div>}
      </div>
    </div>
  );
}
