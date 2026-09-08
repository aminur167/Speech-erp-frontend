/**
 * "YYYY-MM" cycle keys — the shape the backend stores a monthly bill's month
 * in (apps/enrollments/models.py::MonthlyBill.month).
 *
 * Kept as strings rather than Dates throughout: a cycle is a calendar month,
 * not an instant, and the moment one becomes a Date it acquires a day and a
 * timezone that can push it into the month either side of the one meant.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The month a date falls in, from local calendar parts — never UTC. */
export function toMonthKey(value: Date = new Date()): string {
  return buildMonthKey(value.getFullYear(), value.getMonth() + 1);
}

/** `month` is 1-based, as people write it. */
export function buildMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function splitMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/** Moves a cycle forward or back, carrying across the year boundary. */
export function shiftMonthKey(key: string, by: number): string {
  const { year, month } = splitMonthKey(key);
  // Date does the carry arithmetic correctly for any offset, including
  // negative ones and jumps of more than twelve.
  const moved = new Date(year, month - 1 + by, 1);
  return toMonthKey(moved);
}

/** "2026-09" -> "September 2026". */
export function monthKeyLabel(key: string): string {
  const { year, month } = splitMonthKey(key);
  return `${MONTH_NAMES[month - 1] ?? key} ${year}`;
}

export { MONTH_NAMES };
