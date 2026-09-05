import { apiClient } from "@/lib/api/client";
import { payMonthlyBill, terminateMonthlyEnrollment } from "@/lib/api/monthlyEnrollments";
import { payInstallment, terminateInstallmentPlan } from "@/lib/api/installmentPlans";
import type { PaginatedResponse } from "@/types/api";
import type { Payment, PaymentMethod } from "@/types/domain";

/**
 * The aggregated dues view — the backend joins every enrollment/plan's oldest
 * unpaid bill or installment into one list server-side
 * (apps/duepayments/services.py); nothing is assembled from separate
 * patient/service/enrollment/plan fetches client-side anymore.
 */

export type DuePaymentType = "monthly" | "installment";

export interface DuePaymentItem {
  key: string;
  type: DuePaymentType;
  /** The enrollment or installment plan this item belongs to. */
  refId: string;
  /** The specific bill or installment's own id -- what the atomic pay call needs. */
  itemId: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  serviceId: string;
  serviceName: string;
  branchId: string;
  label: string;
  /** Payable right now — the current bill or installment only. */
  amount: number;
  /** Everything still unpaid on the enrollment/plan — what terminating writes off. */
  outstandingTotal: number;
  dueDate: string;
  status: string;
  /** Installment-only: this due installment's position and how many remain in the plan. */
  installmentIndex?: number;
  installmentsTotal?: number;
  installmentsRemaining?: number;
}

// `amount`/`outstandingTotal` are DRF DecimalFields, so they arrive as JSON
// strings despite the `number` type above. Converted here rather than trusted:
// formatCurrency coerces on display, but a raw string reaching a comparison or
// a sum silently misbehaves (the bug that rendered branch totals as NaN).
interface RawDuePaymentItem
  extends Omit<DuePaymentItem, "refId" | "itemId" | "amount" | "outstandingTotal"> {
  refId: number | string;
  itemId: number | string;
  amount: number | string;
  outstandingTotal: number | string;
}

function normalizeItem(raw: RawDuePaymentItem): DuePaymentItem {
  return {
    ...raw,
    refId: String(raw.refId),
    itemId: String(raw.itemId),
    amount: Number(raw.amount),
    outstandingTotal: Number(raw.outstandingTotal),
  };
}

export interface DuePaymentListParams {
  search?: string;
  type?: DuePaymentType;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export async function listDuePayments(
  params: DuePaymentListParams = {},
): Promise<PaginatedResponse<DuePaymentItem>> {
  const { data } = await apiClient.get<PaginatedResponse<RawDuePaymentItem>>("/due-payments/", {
    params: {
      search: params.search,
      type: params.type,
      branch: params.branchId,
      page: params.page,
      pageSize: params.pageSize,
    },
  });
  return { ...data, results: data.results.map(normalizeItem) };
}

export interface DuePaymentsSummary {
  totalDue: number;
  monthlyDue: number;
  installmentDue: number;
}

/**
 * `date` (an ISO "YYYY-MM-DD" from a date picker) reconstructs what was
 * outstanding as of that day; defaults to the current outstanding snapshot
 * when omitted.
 */
export async function getDuePaymentsSummary(
  branchId?: string,
  date?: string,
): Promise<DuePaymentsSummary> {
  const { data } = await apiClient.get<DuePaymentsSummary>("/due-payments/summary/", {
    params: { branch: branchId, date },
  });
  return data;
}

export interface CollectDuePaymentInput {
  item: Pick<DuePaymentItem, "type" | "refId" | "itemId">;
  method: PaymentMethod;
  idempotencyKey?: string;
  /**
   * Installments only — collect whatever the patient can pay today, with the
   * rest carried into the later installments. Monthly bills stay all-or-
   * nothing (the confirmed rule is full payment by the 5th).
   */
  amount?: number;
}

/**
 * One atomic call per type -- reuses the same pay-bill / pay-installment
 * endpoint the enrollment wizards use, so collecting a due payment and
 * collecting the first payment of a fresh enrollment go through identical,
 * already-tested backend logic.
 */
export async function collectDuePayment(input: CollectDuePaymentInput): Promise<Payment> {
  if (input.item.type === "monthly") {
    const { payment } = await payMonthlyBill(
      input.item.refId, input.item.itemId, input.method, input.idempotencyKey,
    );
    return payment;
  }
  const { payment } = await payInstallment(
    input.item.refId, input.item.itemId, input.method, input.idempotencyKey, input.amount,
  );
  return payment;
}

/** Ends a patient's monthly enrollment or installment plan — it stops generating due bills/installments. */
export async function terminateDuePaymentService(
  item: Pick<DuePaymentItem, "type" | "refId">,
): Promise<void> {
  if (item.type === "monthly") {
    await terminateMonthlyEnrollment(item.refId);
  } else {
    await terminateInstallmentPlan(item.refId);
  }
}
