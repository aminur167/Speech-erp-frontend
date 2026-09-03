import { formatCurrency } from "@/utils/currency";

/** `receipt_number` / `receiptNumber` -> "Receipt number". */
export function humanizeField(field: string): string {
  const spaced = field.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

// Money and timestamps are the two things that look wrong when printed raw
// ("5000.00", "2026-09-03T11:20:00Z"), and both are recognisable from the
// field name — which is what lets one renderer handle every table's rows
// without a per-table format map.
const MONEY_FIELD = /(amount|fee|total|price|paid|due|balance|revenue|cost|advance|collected)$/i;
const DATE_FIELD = /(at|date|on)$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/;

function looksNumeric(value: unknown): value is number | string {
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value));
}

/**
 * A single row field, rendered the way that field deserves.
 *
 * Returns a string rather than a node so the same logic can feed a drawer, a
 * tooltip, or an export without three versions of it.
 */
export function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (MONEY_FIELD.test(field) && looksNumeric(value)) {
    return formatCurrency(Number(value));
  }

  if (DATE_FIELD.test(field) && typeof value === "string" && ISO_DATE.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      // A date-only value has no meaningful time to show; a timestamp does.
      return value.includes("T")
        ? parsed.toLocaleString()
        : parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
  }

  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

/**
 * Fields worth showing in a detail panel, in a stable order.
 *
 * Drops the plumbing nobody reads (raw ids, offline-sync bookkeeping) and
 * anything empty, so the panel shows what the record actually has rather
 * than a column of dashes.
 */
const HIDDEN_FIELDS = new Set([
  "id",
  "branchId",
  "patientId",
  "serviceId",
  "idempotencyKey",
  "clientCreatedAt",
]);

export function visibleFields(
  data: Record<string, unknown>,
  extraHidden: string[] = [],
): [string, unknown][] {
  const hidden = new Set([...HIDDEN_FIELDS, ...extraHidden]);
  return Object.entries(data).filter(([key, value]) => {
    if (hidden.has(key)) return false;
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}
