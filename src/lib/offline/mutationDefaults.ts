import type { QueryClient } from "@tanstack/react-query";
import { payMonthlyBill } from "@/lib/api/monthlyEnrollments";
import { payInstallment } from "@/lib/api/installmentPlans";
import { createPatient } from "@/lib/api/patients";
import { createExpense } from "@/lib/api/expenses";
import { adjustStock, sellMaterials } from "@/lib/api/materials";
import { createBooking } from "@/lib/api/bookings";
import { collectDuePayment } from "@/lib/api/duePayments";
import { queryKeys } from "@/lib/queryKeys";

/**
 * The mutation keys registered below — the only mutations that actually get
 * paused/queued while offline and replayed later. `useOfflineQueueStatus`
 * uses this same list to scope its "waiting to sync" / "failed to sync"
 * indicator, so an ordinary online validation error (e.g. a wrong password,
 * a duplicate code) on some other mutation never gets mistaken for a sync
 * failure.
 */
export const OFFLINE_MUTATION_KEYS: readonly string[] = [
  "payMonthlyBill",
  "payInstallment",
  "createPatient",
  "createExpense",
  "adjustStock",
  "sellMaterials",
  "createBooking",
  "collectDuePayment",
];

/**
 * Registers a `mutationFn` for every offline-queueable mutation, keyed by
 * `mutationKey`.
 *
 * This is the piece that's easy to miss and silently breaks "survives
 * browser restart" (docs/00): a mutation persisted to IndexedDB carries its
 * `variables` and `state`, but a JS *function* can't be serialized, so
 * `mutationFn` itself is gone the moment the tab closes. A `useMutation()`
 * call inline in a component supplies that function only while the
 * component is mounted — after a real reload, the component that queued the
 * action doesn't exist yet, so `resumePausedMutations()` has nothing to call
 * unless a default was registered here first, matching the mutation's key.
 *
 * Call once, right after the QueryClient is constructed and before the
 * persisted cache is restored.
 */
export function registerOfflineMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(["payMonthlyBill"], {
    mutationFn: (vars: {
      enrollmentId: string;
      billId: string;
      method: string;
      idempotencyKey?: string;
    }) => payMonthlyBill(vars.enrollmentId, vars.billId, vars.method, vars.idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  queryClient.setMutationDefaults(["payInstallment"], {
    mutationFn: (vars: {
      planId: string;
      installmentId: string;
      method: string;
      idempotencyKey?: string;
      // Carried through deliberately: a partial collection queued offline
      // has to replay for the amount actually taken, not the scheduled one.
      amount?: number;
    }) =>
      payInstallment(
        vars.planId,
        vars.installmentId,
        vars.method,
        vars.idempotencyKey,
        vars.amount,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  queryClient.setMutationDefaults(["createPatient"], {
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });

  queryClient.setMutationDefaults(["createExpense"], {
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });

  queryClient.setMutationDefaults(["adjustStock"], {
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
    },
  });

  queryClient.setMutationDefaults(["sellMaterials"], {
    mutationFn: sellMaterials,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  queryClient.setMutationDefaults(["createBooking"], {
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });

  queryClient.setMutationDefaults(["collectDuePayment"], {
    mutationFn: collectDuePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.duePayments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyClosing.all });
    },
  });
}
