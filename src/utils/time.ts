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
