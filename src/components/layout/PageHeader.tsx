import type { ReactNode } from "react";

/**
 * A page's title, with its primary action beside it.
 *
 * Deliberately just the title: the breadcrumb above it repeated what the
 * sidebar already highlights, and the sentence below it described a page the
 * user was already looking at.
 */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      {action}
    </div>
  );
}
