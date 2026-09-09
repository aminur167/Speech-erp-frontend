"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { clsx } from "clsx";

export type SortDirection = "asc" | "desc";

/**
 * Client-side sorting for tables that already hold their whole dataset.
 *
 * Deliberately not offered on the server-paginated lists: sorting one page
 * of ten and labelling the column "sorted" would be a lie — the largest row
 * in the range is usually on some other page. Those tables keep the server's
 * own ordering.
 */
export function useTableSort<T>(
  rows: T[],
  initial: { key: keyof T & string; direction: SortDirection },
) {
  const [sort, setSort] = useState(initial);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const left = a[sort.key as keyof T];
      const right = b[sort.key as keyof T];
      const order =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return sort.direction === "asc" ? order : -order;
    });
    return copy;
  }, [rows, sort]);

  const toggle = (key: keyof T & string) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : // A new column starts descending: on a money or count column the
          // interesting end is the big one, and that is what people reach for.
          { key, direction: "desc" },
    );

  return { sorted, sort, toggle };
}

export function SortHeader<T>({
  label,
  columnKey,
  sort,
  onSort,
  align = "left",
  sticky = false,
  className,
}: {
  label: string;
  columnKey: keyof T & string;
  sort: { key: string; direction: SortDirection };
  onSort: (key: keyof T & string) => void;
  align?: "left" | "right";
  /** Only for a table that scrolls inside its own box — see the note in the header. */
  sticky?: boolean;
  className?: string;
}) {
  const active = sort.key === columnKey;
  const Icon = !active ? ChevronsUpDown : sort.direction === "asc" ? ChevronUp : ChevronDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={clsx(
        "bg-surface py-2 pr-4 font-medium",
        // Sticks to the top of its own scroll box. Left off for a table that
        // scrolls with the page, where it would slide under the toolbar
        // rather than staying put above its rows.
        sticky && "sticky top-0 z-10",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={clsx(
          "inline-flex items-center gap-1 rounded transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          align === "right" && "flex-row-reverse",
          active ? "text-text-primary" : "text-text-secondary",
        )}
      >
        {label}
        <Icon className={clsx("h-3.5 w-3.5", !active && "opacity-40")} />
      </button>
    </th>
  );
}
