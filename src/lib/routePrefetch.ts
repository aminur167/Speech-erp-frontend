import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { REFERENCE_DATA_STALE_MS } from "@/lib/cacheTiming";
import { getPatientDirectorySummary, listPatientDirectory } from "@/lib/api/patientDirectory";
import { getDuePaymentsSummary, listDuePayments } from "@/lib/api/duePayments";
import { getTransactionsSummary } from "@/lib/api/transactions";
import { getExpenseSummary, listExpenses } from "@/lib/api/expenses";
import { getStaffSummary, listStaff } from "@/lib/api/staff";
import { getMaterialsSummary, listMaterials } from "@/lib/api/materials";
import { listServices } from "@/lib/api/services";
import { toMonthKey } from "@/utils/months";
import type { AuthUser } from "@/types/domain";

/**
 * Start loading a page's first data when its link is pointed at, so it is
 * usually already there by the time the click lands.
 *
 * Each entry fetches under the same query key and with the same API function
 * as the page's own hook, with the page's opening filters. If a page's opening
 * filters change and this is not updated, nothing breaks — the prefetch just
 * stops matching and the page loads as it would have anyway. Data that is
 * still fresh is not fetched again, and a request already under way is
 * shared, so hovering back and forth costs nothing.
 */

/** Matches the list pages' PAGE_SIZE. */
const FIRST_PAGE = { page: 1, pageSize: 10 } as const;

type Prefetch = (client: QueryClient, branchId: string | undefined) => void;

const BY_SECTION: Record<string, Prefetch> = {
  // PatientListView
  patients: (client, branchId) => {
    const params = { search: "", branchId, ...FIRST_PAGE };
    void client.prefetchQuery({
      queryKey: queryKeys.patients.directory(params),
      queryFn: () => listPatientDirectory(params),
    });
    void client.prefetchQuery({
      queryKey: queryKeys.patients.directorySummary(branchId, undefined),
      queryFn: () => getPatientDirectorySummary(branchId, undefined),
    });
  },
  // DuePaymentCollectionView: opens on monthly, current month.
  "due-payments": (client, branchId) => {
    const params = { type: "monthly" as const, month: toMonthKey(), branchId, ...FIRST_PAGE };
    void client.prefetchQuery({
      queryKey: queryKeys.duePayments.list(params),
      queryFn: () => listDuePayments(params),
    });
    void client.prefetchQuery({
      queryKey: queryKeys.duePayments.summary(branchId, undefined),
      queryFn: () => getDuePaymentsSummary(branchId, undefined),
    });
  },
  // TransactionHistoryView — the list's date bounds are computed inside the
  // view, so only its summary is warmed here.
  transactions: (client, branchId) => {
    void client.prefetchQuery({
      queryKey: queryKeys.transactions.summary(branchId, undefined),
      queryFn: () => getTransactionsSummary(branchId, undefined),
    });
  },
  // ExpenseListView
  expenses: (client, branchId) => {
    const params = { search: "", branchId, ...FIRST_PAGE };
    void client.prefetchQuery({
      queryKey: queryKeys.expenses.list(params),
      queryFn: () => listExpenses(params),
    });
    void client.prefetchQuery({
      queryKey: queryKeys.expenses.summary(branchId, undefined),
      queryFn: () => getExpenseSummary({ branchId, date: undefined }),
    });
  },
  // StaffListView
  staff: (client, branchId) => {
    void client.prefetchQuery({
      queryKey: queryKeys.staff.list(branchId),
      queryFn: () => listStaff(branchId),
      staleTime: REFERENCE_DATA_STALE_MS,
    });
    void client.prefetchQuery({
      queryKey: queryKeys.staff.summary(branchId),
      queryFn: () => getStaffSummary(branchId),
    });
  },
  // MaterialListView
  materials: (client, branchId) => {
    void client.prefetchQuery({
      queryKey: queryKeys.materials.list(branchId),
      queryFn: () => listMaterials(branchId),
    });
    void client.prefetchQuery({
      queryKey: queryKeys.materials.summary(branchId),
      queryFn: () => getMaterialsSummary(branchId),
    });
  },
};

/** ServiceCatalogView: a Manager's catalog passes no branch (the server scopes it). */
function prefetchPackages(client: QueryClient, branchId: string | undefined) {
  const args = { category: undefined, includeInactive: true, includePending: true, branchId };
  void client.prefetchQuery({
    queryKey: queryKeys.services.list(args),
    queryFn: () => listServices(undefined, true, true, branchId),
    staleTime: REFERENCE_DATA_STALE_MS,
  });
}

export function prefetchRoute(client: QueryClient, href: string, user: AuthUser | null): void {
  if (!user) return;
  const segments = href.split("/").filter(Boolean);
  const section = segments[segments.length - 1];

  // Which branch the page will show: the one in an Admin branch link, a
  // Manager's own, or none for Admin's organisation-wide pages.
  const branchLink = segments[0] === "admin" && segments[1] === "branches" && segments[2];
  const branchId = branchLink
    ? segments[2]
    : user.role === "manager"
      ? (user.branchId ?? undefined)
      : undefined;

  if (section === "packages") {
    prefetchPackages(client, branchLink ? branchId : undefined);
    return;
  }
  BY_SECTION[section]?.(client, branchId);
}
