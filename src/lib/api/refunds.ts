import { apiClient } from "@/lib/api/client";
import { normalizePayment, type RawPayment } from "@/lib/api/payments";
import type { PaginatedResponse } from "@/types/api";
import type { RefundBillAction, RefundRequest, RefundRequestStatus } from "@/types/domain";

interface RawRefundRequestItem {
  id: number | string;
  material: number | string;
  materialName: string;
  quantity: number;
  unitPrice: number;
}
interface RawRefundRequest extends Omit<RefundRequest, "id" | "payment" | "items"> {
  id: number | string;
  payment: RawPayment;
  items: RawRefundRequestItem[];
}

function normalizeRefundRequest(raw: RawRefundRequest): RefundRequest {
  return {
    ...raw,
    id: String(raw.id),
    payment: normalizePayment(raw.payment),
    items: raw.items.map((item) => ({
      ...item,
      id: String(item.id),
      material: String(item.material),
    })),
  };
}

export interface RequestRefundItemInput {
  materialId: string;
  quantity: number;
}

export interface RequestRefundInput {
  paymentId: string;
  reason: string;
  /** Provide either a flat amount, or the material lines being returned (never both). */
  amount?: number;
  items?: RequestRefundItemInput[];
}

/**
 * Opens a refund request -- nothing changes on the payment until an Admin
 * approves it (docs/04's separation of duties: the person who took the money
 * can't also send it back on their own authority). For a material sale, the
 * amount is recomputed server-side from the sale's own stored prices, so
 * `amount` is dropped whenever `items` is supplied -- the backend ignores it
 * anyway, but sending both would misleadingly suggest the client's number is
 * what counts.
 */
export async function requestRefund(input: RequestRefundInput): Promise<RefundRequest> {
  const { data } = await apiClient.post<RawRefundRequest>(
    `/payments/${input.paymentId}/refund-requests/`,
    {
      reason: input.reason,
      ...(input.items && input.items.length > 0
        ? { items: input.items.map((item) => ({ material: item.materialId, quantity: item.quantity })) }
        : { amount: input.amount }),
    },
  );
  return normalizeRefundRequest(data);
}

export interface RefundRequestListParams {
  status?: RefundRequestStatus;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

/** The Admin approval queue -- Manager sees their own branch's requests (read-only), Admin sees and can act on all. */
export async function listRefundRequests(
  params: RefundRequestListParams = {},
): Promise<PaginatedResponse<RefundRequest>> {
  const { data } = await apiClient.get<PaginatedResponse<RawRefundRequest>>(
    "/refund-requests/",
    { params: { status: params.status, branch: params.branchId, page: params.page, pageSize: params.pageSize } },
  );
  return { ...data, results: data.results.map(normalizeRefundRequest) };
}

export interface ApproveRefundInput {
  id: string;
  billAction: RefundBillAction;
  refundMethod?: string;
  reviewNote?: string;
}

export async function approveRefund(input: ApproveRefundInput): Promise<RefundRequest> {
  const { data } = await apiClient.post<RawRefundRequest>(
    `/refund-requests/${input.id}/approve/`,
    { billAction: input.billAction, refundMethod: input.refundMethod, reviewNote: input.reviewNote },
  );
  return normalizeRefundRequest(data);
}

export interface RejectRefundInput {
  id: string;
  reviewNote: string;
}

export async function rejectRefund(input: RejectRefundInput): Promise<RefundRequest> {
  const { data } = await apiClient.post<RawRefundRequest>(
    `/refund-requests/${input.id}/reject/`,
    { reviewNote: input.reviewNote },
  );
  return normalizeRefundRequest(data);
}
