import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  convertEnquiry,
  createEnquiry,
  deleteEnquiry,
  getEnquirySummary,
  listEnquiries,
  updateEnquiry,
  type ConvertEnquiryInput,
  type ConvertEnquiryResult,
  type EnquiryInput,
  type EnquiryListParams,
} from "@/lib/api/enquiries";
import type { ApiError } from "@/types/api";
import type { Enquiry } from "@/types/domain";

export function useEnquiries(params: EnquiryListParams) {
  return useQuery({
    queryKey: queryKeys.enquiries.list(params),
    queryFn: () => listEnquiries(params),
    // Keep the current page on screen while the next page or filter loads.
    placeholderData: (previousData) => previousData,
  });
}

/** The same filters as the list, so the header describes the rows beneath it. */
export function useEnquirySummary(params: EnquiryListParams) {
  return useQuery({
    queryKey: queryKeys.enquiries.summary(params),
    queryFn: () => getEnquirySummary(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation<Enquiry, ApiError, EnquiryInput>({
    meta: { successMessage: "Enquiry recorded." },
    mutationFn: createEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });
}

export function useUpdateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation<Enquiry, ApiError, { id: string; input: Partial<EnquiryInput> }>({
    meta: { successMessage: "Enquiry updated." },
    mutationFn: ({ id, input }) => updateEnquiry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });
}

export function useDeleteEnquiry() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    meta: { successMessage: "Enquiry removed." },
    mutationFn: deleteEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });
}

export function useConvertEnquiry() {
  const queryClient = useQueryClient();

  return useMutation<ConvertEnquiryResult, ApiError, ConvertEnquiryInput>({
    meta: { successMessage: "Patient registered from this enquiry." },
    mutationFn: convertEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      // A new patient exists now — the directory and its counts are stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });
}
