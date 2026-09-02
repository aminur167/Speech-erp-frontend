import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/mutationDefaults";
import type { ApiError } from "@/types/api";

function isOfflineQueueableMutation(mutationKey: readonly unknown[] | undefined): boolean {
  const key = mutationKey?.[0];
  return typeof key === "string" && OFFLINE_MUTATION_KEYS.includes(key);
}

const ACTION_LABELS: Record<string, string> = {
  payMonthlyBill: "Monthly bill payment",
  payInstallment: "Installment payment",
  createPatient: "Add patient",
  createExpense: "Add expense",
  adjustStock: "Stock adjustment",
  sellMaterials: "Material sale",
  createBooking: "Online booking",
  collectDuePayment: "Due payment collection",
};

function humanizeFieldName(field: string): string {
  const spaced = field.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

// A rejected mutation carries an ApiError, not a generic Error -- and when
// the backend rejects on a specific field (e.g. "phone already registered
// to another patient") rather than the request as a whole, that detail
// lives in `fieldErrors`, not `message` (which falls back to a generic
// "Something went wrong" in that case). Prefer the field-level reason so
// staff see what actually needs fixing instead of a dead end.
function describeMutationError(error: unknown): string {
  const apiError = error as ApiError | null;
  if (apiError?.fieldErrors) {
    const [field, messages] = Object.entries(apiError.fieldErrors)[0] ?? [];
    if (field && messages?.[0]) {
      return `${humanizeFieldName(field)}: ${messages[0]}`;
    }
  }
  return apiError?.message ?? "Failed to sync.";
}

export interface FailedMutation {
  id: number;
  label: string;
  message: string;
  submittedAt: number;
}

/**
 * Reads the outbox's live state straight from TanStack Query's mutation
 * cache — no separate store to keep in sync.
 *
 * - `queuedCount`: paused, waiting for connectivity (docs/00 item 7,
 *   "visible pending count... so nobody closes the laptop mid-queue
 *   unaware").
 * - `syncingCount`: actively in flight right now (back online, draining).
 * - `failed`: mutations the server definitively rejected once it actually
 *   saw them (e.g. "out of stock", "must pay August first") -- never
 *   silently dropped; surfaced here so staff can resolve them (docs/00,
 *   "Sync-time rejection must be recoverable").
 */
export function useOfflineQueueStatus() {
  const queryClient = useQueryClient();

  const pending = useMutationState({
    filters: {
      status: "pending",
      predicate: (mutation) => isOfflineQueueableMutation(mutation.options.mutationKey),
    },
    select: (mutation) => ({ isPaused: mutation.state.isPaused }),
  });

  const failed: FailedMutation[] = useMutationState({
    filters: {
      status: "error",
      predicate: (mutation) => isOfflineQueueableMutation(mutation.options.mutationKey),
    },
    select: (mutation) => {
      const key = mutation.options.mutationKey?.[0] as string | undefined;
      return {
        id: mutation.mutationId,
        label:
          (mutation.options.meta?.label as string | undefined) ??
          (key ? ACTION_LABELS[key] : undefined) ??
          key ??
          "An action",
        message: describeMutationError(mutation.state.error),
        submittedAt: mutation.state.submittedAt,
      };
    },
  });

  const queuedCount = pending.filter((m) => m.isPaused).length;
  const syncingCount = pending.length - queuedCount;

  const dismissFailed = (id: number) => {
    const mutation = queryClient
      .getMutationCache()
      .getAll()
      .find((m) => m.mutationId === id);
    if (mutation) queryClient.getMutationCache().remove(mutation);
  };

  return { queuedCount, syncingCount, failed, dismissFailed };
}
