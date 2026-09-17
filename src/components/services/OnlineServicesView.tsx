"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { OnlineServiceEnrollment } from "@/components/services/OnlineServiceEnrollment";
import { OnlineBookingsTable } from "@/components/enrollments/OnlineBookingsTable";

type Tab = "new" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "Book New" },
  { key: "all", label: "All Bookings" },
];

/** Switches between booking a new online appointment and reviewing every one already made — including a website visitor's own, still awaiting its advance. */
export function OnlineServicesView() {
  const [tab, setTab] = useState<Tab>("new");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === entry.key
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-primary-light/50 hover:text-text-primary",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "new" && <OnlineServiceEnrollment />}
      {tab === "all" && <OnlineBookingsTable />}
    </div>
  );
}
