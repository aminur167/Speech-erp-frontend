import type { ReactNode } from "react";
import { clsx } from "clsx";
import { SlidersHorizontal } from "lucide-react";

/** Consistent width for every filter field inside a FilterBar, so dropdowns line up evenly. */
export const FILTER_FIELD_WIDTH = "w-full sm:w-40 shrink-0";

/**
 * A list page's one toolbar row, placed directly under its stat cards and
 * above the data it narrows: search first, then the filters, then the date,
 * then the page's own actions (Refresh, Columns, Export) at the far end.
 *
 * Everything that changes what the table shows lives in this single row, so a
 * manager never has to look in two places to see why a list is shorter than
 * expected. It wraps rather than scrolls on narrow screens.
 *
 * - `search` grows to take whatever width the filters leave.
 * - Without a search box the bar keeps its "Filters" label, since nothing else
 *   would say what the row is for.
 */
export function FilterBar({
  children,
  search,
  dateSlot,
  actions,
}: {
  children?: ReactNode;
  search?: ReactNode;
  dateSlot?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      {/* Bottom-aligned: filters carry a title above them and buttons do not,
          so their boxes only line up along the bottom edge. */}
      <div className="flex flex-wrap items-end gap-2.5">
        {search ? (
          <div className="min-w-[240px] flex-1">{search}</div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 pr-1 pb-2.5 text-text-secondary">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
          </div>
        )}

        {children}

        {dateSlot && <div className={clsx("shrink-0", !search && "ml-auto")}>{dateSlot}</div>}

        {actions && (
          <div
            className={clsx(
              "flex shrink-0 items-center gap-2",
              !search && !dateSlot && "ml-auto",
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
