"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

/**
 * Roster / Attendance / Payroll, as three routes rather than three pieces of
 * component state.
 *
 * Each one is a different question a manager comes to the page to answer —
 * who works here, who is in today, who has been paid — and they used to be
 * crammed into one seven-column table, where the attendance controls and the
 * payroll status read as decoration on the roster. Separate URLs mean a tab
 * survives a reload, can be bookmarked, and can be linked to from a
 * notification.
 *
 * Admin reaches the same three under a branch (`/admin/branches/{id}/staff`),
 * so the hrefs are built from a base the caller passes rather than hardcoded.
 */
const TABS = [
  { key: "roster", label: "Roster", segment: "" },
  { key: "attendance", label: "Attendance", segment: "/attendance" },
  { key: "payroll", label: "Payroll", segment: "/payroll" },
] as const;

export function StaffTabs({ base }: { base: string }) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Staff sections"
      className="-mx-1 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const href = `${base}${tab.segment}`;
        // Exact match, not `startsWith`: the roster's href is a prefix of the
        // other two, so a prefix test would light it up on every tab.
        const isActive = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-primary-light/50 hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
