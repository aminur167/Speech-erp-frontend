import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/mutationDefaults";

function isOfflineQueueableMutation(mutationKey: readonly unknown[] | undefined): boolean {
  const key = mutationKey?.[0];
  return typeof key === "string" && OFFLINE_MUTATION_KEYS.includes(key);
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
    select: (mutation) => ({
      id: mutation.mutationId,
      label:
        (mutation.options.meta?.label as string | undefined) ??
        (mutation.options.mutationKey?.join(" ") as string | undefined) ??
        "An action",
      message:
        (mutation.state.error as { message?: string } | null)?.message ??
        "Failed to sync.",
      submittedAt: mutation.state.submittedAt,
    }),
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
