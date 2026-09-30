"use client";

import { useId } from "react";
import { CalendarDays } from "lucide-react";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Input } from "@/components/ui/Input";
import { toLocalDateString } from "@/utils/time";

/** Lets Admin/Manager pick any date to view that day's (and that month's) dashboard state instead of today's. */
export function DashboardDateFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isToday = value === toLocalDateString();
  const inputId = useId();

  return (
    <div className="flex items-end gap-2">
      <div>
        {/* Outside the icon's wrapper: inside it, the icon would centre on
            title and box together and sit too high. */}
        <FieldLabel htmlFor={inputId}>Date</FieldLabel>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            id={inputId}
            type="date"
            value={value}
            max={toLocalDateString()}
            onChange={(event) => onChange(event.target.value || toLocalDateString())}
            containerClassName="w-auto"
            className="w-44 pl-9"
          />
        </div>
      </div>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(toLocalDateString())}
          className="shrink-0 pb-2 text-sm font-medium text-primary hover:underline"
        >
          Today
        </button>
      )}
    </div>
  );
}
