import { useMutation } from "@tanstack/react-query";
import { updateProfile, type UpdateProfileInput } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { ApiError } from "@/types/api";
import type { AuthUser } from "@/types/domain";

export function useUpdateProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation<AuthUser, ApiError, UpdateProfileInput>({
    mutationFn: updateProfile,
    onSuccess: (user) => updateUser(user),
  });
}
