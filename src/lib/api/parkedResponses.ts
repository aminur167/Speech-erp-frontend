/**
 * Answers fetched ahead of time by a batch (lib/api/batch.ts), waiting for
 * the normal request that would have fetched them.
 *
 * Kept free of imports so the API client can read it without a cycle.
 */

export type ParamValue = string | number | boolean | null | undefined;

/** Long enough to cover the page mounting right after the batch lands. */
const PARKED_FOR_MS = 15_000;

const parked = new Map<string, { data: unknown; until: number }>();

/** Drops empty values and stringifies the rest, matching what axios sends. */
export function cleanParams(params: Record<string, ParamValue> = {}): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") clean[key] = String(value);
  }
  return clean;
}

function keyFor(path: string, params?: Record<string, ParamValue>): string {
  const clean = cleanParams(params);
  const query = Object.keys(clean)
    .sort()
    .map((key) => `${key}=${clean[key]}`)
    .join("&");
  return `${path}?${query}`;
}

export function park(path: string, params: Record<string, ParamValue> | undefined, data: unknown) {
  parked.set(keyFor(path, params), { data, until: Date.now() + PARKED_FOR_MS });
}

/** The parked answer for this GET, once — later refetches go to the network. */
export function takeParked(path: string | undefined, params: unknown): { data: unknown } | null {
  if (!path || parked.size === 0) return null;
  const key = keyFor(path, (params ?? {}) as Record<string, ParamValue>);
  const entry = parked.get(key);
  if (!entry) return null;
  parked.delete(key);
  return entry.until >= Date.now() ? { data: entry.data } : null;
}

/** Nothing parked may outlive the user who fetched it. */
export function clearParked(): void {
  parked.clear();
}
