/**
 * One idempotency key per user action, generated the moment they act — never
 * regenerated on retry (docs/00's Full Offline-First section). A mutation
 * queued while offline, or replayed after a network retry, carries the same
 * key every time it's sent, so the backend can tell "this already succeeded"
 * apart from "this is a new action" and return the original result instead
 * of doing it twice.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for a non-secure-context browser without crypto.randomUUID —
  // still unique enough for this purpose (a client-generated dedup key, not
  // a security token).
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
