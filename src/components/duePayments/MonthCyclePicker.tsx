"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  MONTH_NAMES,
  buildMonthKey,
  shiftMonthKey,
  splitMonthKey,
  toMonthKey,
} from "@/utils/months";

/** How far either side of this year the year dropdown reaches. */
const YEARS_BACK = 3;
const YEARS_FORWARD = 1;

/**
 * Picks a billing cycle: month and year, with arrows for the common case.
 *
 * Both halves are here on purpose. The arrows are what a manager actually
 * uses — last month, next month, back again — while the dropdowns are the
 * only way to reach a cycle several months out without clicking through
 * every one in between.
 */
export function MonthCyclePicker({
  value,
  onChange,
  disabled,
}: {
  /** "YYYY-MM". */
  value: string;
  onChange: (month: string) => void;
  disabled?: boolean;
}) {
  const { year, month } = splitMonthKey(value);
  const thisYear = new Date().getFullYear();

  const years = Array.from(
    { length: YEARS_BACK + YEARS_FORWARD + 1 },
    (_, index) => thisYear - YEARS_BACK + index,
  );
  // A cycle reached with the arrows can sit outside the dropdown's window;
  // without this the select would show a year it has no option for and
  // silently render blank.
  if (!years.includes(year)) years.push(year);
  years.sort((a, b) => a - b);

  const step = (by: number) => () => onChange(shiftMonthKey(value, by));
  const isThisMonth = value === toMonthKey();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={step(-1)}
        disabled={disabled}
        title="Previous month"
        aria-label="Previous month"
        className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Select
        value={String(month)}
        aria-label="Month"
        disabled={disabled}
        onChange={(event) => onChange(buildMonthKey(year, Number(event.target.value)))}
        containerClassName="w-32 shrink-0"
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </Select>

      <Select
        value={String(year)}
        aria-label="Year"
        disabled={disabled}
        onChange={(event) => onChange(buildMonthKey(Number(event.target.value), month))}
        containerClassName="w-24 shrink-0"
      >
        {years.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <button
        type="button"
        onClick={step(1)}
        disabled={disabled}
        title="Next month"
        aria-label="Next month"
        className="rounded-lg border border-border p-1.5 text-text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isThisMonth && (
        <button
          type="button"
          onClick={() => onChange(toMonthKey())}
          className="rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-light"
        >
          This month
        </button>
      )}
    </div>
  );
}
