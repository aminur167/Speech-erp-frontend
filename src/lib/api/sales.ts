import { apiClient } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type { MaterialSale } from "@/types/domain";

export interface SaleHistoryParams {
  /** Buyer name or phone, product name or code, or receipt number — one box, server-side. */
  search?: string;
  /** Admin only; a Manager is always scoped to their own branch by the server. */
  branchId?: string;
  /** A single day, "YYYY-MM-DD". Takes precedence over the range below. */
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * What went over the counter. Voided sales are not returned — removing one
 * from this list is what Delete does, and the voided payment stays visible on
 * Transactions, which is the screen that shows everything that happened.
 */
export async function listSales(
  params: SaleHistoryParams = {},
): Promise<PaginatedResponse<MaterialSale>> {
  const { data } = await apiClient.get<PaginatedResponse<MaterialSale>>(
    "/materials/sales/",
    {
      params: {
        search: params.search || undefined,
        branch: params.branchId || undefined,
        date: params.date || undefined,
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        page: params.page,
        pageSize: params.pageSize,
      },
    },
  );
  return data;
}

export interface UpdateSaleCustomerInput {
  saleId: string;
  name: string;
  phone: string;
}

/**
 * Correct the name or phone a counter sale was billed to.
 *
 * Walk-in buyers only — the server refuses with `not_a_walk_in` for a sale
 * billed to a registered patient, whose details belong to their own profile.
 * Nothing financial moves: the payment, its lines and the stock are untouched.
 */
export async function updateSaleCustomer({
  saleId,
  name,
  phone,
}: UpdateSaleCustomerInput): Promise<MaterialSale> {
  const { data } = await apiClient.patch<MaterialSale>(
    `/materials/sales/${saleId}/customer/`,
    { name, phone },
  );
  return data;
}

export interface VoidSaleInput {
  saleId: string;
  reason: string;
}

/**
 * Remove a sale from the history.
 *
 * The existing void, under the existing rules — a Manager may only void the
 * current day's sales, Admin any day, and a reason is required either way.
 * The goods go back on the shelf; the money record survives as a voided
 * payment rather than being destroyed.
 */
export async function voidSale({ saleId, reason }: VoidSaleInput): Promise<MaterialSale> {
  const { data } = await apiClient.post<MaterialSale>(
    `/materials/sales/${saleId}/void/`,
    { reason },
  );
  return data;
}
