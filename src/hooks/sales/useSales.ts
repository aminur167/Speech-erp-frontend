import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  listSales,
  updateSaleCustomer,
  voidSale,
  type SaleHistoryParams,
  type UpdateSaleCustomerInput,
  type VoidSaleInput,
} from "@/lib/api/sales";
import type { ApiError } from "@/types/api";
import type { MaterialSale } from "@/types/domain";

export function useSales(params: SaleHistoryParams) {
  return useQuery({
    queryKey: queryKeys.sales.list(params),
    queryFn: () => listSales(params),
    // Keep the current page on screen while the next page or filter loads.
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateSaleCustomer() {
  const queryClient = useQueryClient();

  return useMutation<MaterialSale, ApiError, UpdateSaleCustomerInput>({
    meta: { successMessage: "Customer details updated." },
    mutationFn: updateSaleCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      // The buyer is a patient row, so a corrected name shows up wherever
      // that row is read — their receipt, the transaction list.
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();

  return useMutation<MaterialSale, ApiError, VoidSaleInput>({
    meta: { successMessage: "Sale removed. The items are back in stock." },
    mutationFn: voidSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      // Voiding returns the goods to stock and takes the money out of
      // revenue, so both of those screens are now stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}
