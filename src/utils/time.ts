/**
 * Converts a 24-hour "HH:MM" time (what the backend stores and what a native
 * `<input type="time">` produces) into a friendly 12-hour label for display.
 *
 * Display-only — never send the result of this back to the API. The
 * booking endpoint's server-side validation parses the raw time with
 * `int(hour):int(minute)` and rejects anything else, a 12-hour label
 * included (see apps/enrollments/services.py::_validate_booking_slot).
 */
export function formatTimeLabel(value: string): string {
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

/**
 * A `Date` as the local calendar date, `YYYY-MM-DD`.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that converts to UTC first,
 * so local midnight at any positive offset (Dhaka is UTC+6) formats as the
 * *previous* day. Used for date inputs and range pickers, where being a day
 * out is the difference between "this month" starting on the 1st and on the
 * 31st of last month.
 */
export function toLocalDateString(value: Date = new Date()): string {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}
