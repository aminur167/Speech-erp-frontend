/**
 * The backend accepts snake_case request bodies (every write serializer in
 * Django/DRF mirrors its model's field names directly) but returns camelCase
 * responses (every read serializer explicitly aliases via `source=`). Rather
 * than touch every existing camelCase TypeScript interface and every form in
 * the app, the API layer converts at the boundary: `toSnakeCase` before a
 * request body goes out, `fieldErrorsToCamelCase` on the way back for
 * validation errors (which reflect the write serializer's raw snake_case
 * field names, since they never go through the read serializer's aliasing).
 */

function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

/** Deep conversion — request bodies can carry nested objects/arrays (e.g. line items). */
export function toSnakeCase<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => toSnakeCase(item)) as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        camelToSnakeKey(key),
        toSnakeCase(val),
      ]),
    ) as T;
  }
  return value as T;
}

/** Shallow is enough here — DRF validation errors are field: [messages], one level deep. */
export function fieldErrorsToCamelCase(
  errors: Record<string, string[]>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [snakeToCamelKey(key), messages]),
  );
}
