import { useMutation } from "@tanstack/react-query";
import { changePassword, type ChangePasswordInput } from "@/lib/api/auth";
import type { ApiError } from "@/types/api";

export function useChangePassword() {
  return useMutation<void, ApiError, ChangePasswordInput>({
    mutationFn: changePassword,
  });
}
