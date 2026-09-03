"use client";

import { useCallback, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import { Drawer } from "@/components/ui/Drawer";
import { formatFieldValue, humanizeField, visibleFields } from "@/utils/fields";

/**
 * Every table row opens the same panel, so a row never has to decide how to
 * present itself and a new table gets the behaviour for free.
 *
 * Fields are derived from the row object rather than declared per table: the
 * domain types already carry good names, and a hand-written field list per
 * table is the thing that silently goes stale when a field is added.
 */

/** Anything the user can already act on shouldn't also open the panel. */
const INTERACTIVE = "a, button, input, select, textarea, label, [role='button']";

/**
 * Did this event start on a control inside the row, rather than the row?
 *
 * `closest` walks up from the target, so it would happily match the row
 * itself if the row carried one of these roles — the row must be excluded
 * explicitly or clicking it would always look like clicking a control.
 */
function cameFromControl(event: { target: EventTarget | null; currentTarget: EventTarget }): boolean {
  const hit = (event.target as HTMLElement | null)?.closest(INTERACTIVE);
  return Boolean(hit) && hit !== event.currentTarget;
}

export function useRowDetail<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const close = useCallback(() => setSelected(null), []);

  /**
   * Spread onto `<tr>`. Keyboard-reachable as well as clickable — a row that
   * only responds to a mouse is not usable for everyone.
   */
  const rowProps = useCallback(
    (row: T, className?: string) => ({
      onClick: (event: MouseEvent<HTMLTableRowElement>) => {
        if (cameFromControl(event)) return;
        setSelected(row);
      },
      onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (cameFromControl(event)) return;
        event.preventDefault();
        setSelected(row);
      },
      // Focusable so the row is reachable by keyboard, but deliberately not
      // role="button": a row is a row, and claiming otherwise takes it out of
      // the table semantics a screen reader uses to navigate.
      tabIndex: 0,
      title: "View full details",
      className: clsx(
        "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-primary-light/40 focus:outline-none focus-visible:bg-primary-light/40",
        className,
      ),
    }),
    [],
  );

  return { selected, setSelected, close, rowProps, isOpen: selected !== null };
}

export function RowDetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  data,
  hiddenFields,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** The row itself — shown field by field. */
  data: object | null;
  hiddenFields?: string[];
  footer?: ReactNode;
  /** Rendered above the field list, for anything the generic view can't express. */
  children?: ReactNode;
}) {
  // Cast lives here, once: domain types are plain objects but don't carry an
  // index signature, and every caller passing its own row shouldn't have to
  // repeat the same assertion.
  const fields = data ? visibleFields(data as Record<string, unknown>, hiddenFields) : [];

  return (
    <Drawer open={open} onClose={onClose} title={title} description={subtitle} footer={footer}>
      {children}
      {fields.length === 0 ? (
        <p className="text-sm text-text-secondary">No further details recorded.</p>
      ) : (
        <dl className="flex flex-col">
          {fields.map(([field, value]) => (
            <div
              key={field}
              className="flex justify-between gap-4 border-b border-border/60 py-2.5 last:border-0"
            >
              <dt className="shrink-0 text-xs font-medium text-text-secondary">
                {humanizeField(field)}
              </dt>
              <dd className="break-words text-right text-sm text-text-primary">
                {formatFieldValue(field, value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Drawer>
  );
}
