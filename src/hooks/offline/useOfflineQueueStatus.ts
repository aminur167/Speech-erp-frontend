import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/mutationDefaults";
import { toApiError } from "@/lib/api/errors";

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

// The client already turns a field-level rejection ("phone already
// registered to another patient") into a readable sentence, so the sync
// indicator and the toast say exactly the same thing.
function describeMutationError(error: unknown): string {
  return toApiError(error).message;
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
