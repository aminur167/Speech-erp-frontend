"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { logout as logoutOnServer } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/auth/useUpdateProfile";
import { useChangePassword } from "@/hooks/auth/useChangePassword";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import type { ApiError } from "@/types/api";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SettingsView({
  homeHref,
  roleLabel,
}: {
  homeHref: string;
  roleLabel: string;
}) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const branchName = useCurrentBranchName();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [showSaved, setShowSaved] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
    reset: resetPasswordForm,
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  if (!user) return null;

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      { userId: user.id, name: values.name },
      {
        onSuccess: () => {
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2500);
        },
      },
    );
  };

  const onSubmitPassword = (values: PasswordFormValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          resetPasswordForm();
          setPasswordSuccess(true);
          // Changing a password ends every other session too (server-side
          // blacklist), including this one's refresh token -- sign out
          // cleanly here rather than let this tab discover that the next
          // time it tries to refresh.
          setTimeout(() => {
            logout();
            void logoutOnServer();
            router.push("/login");
          }, 1800);
        },
        onError: (error: ApiError) => {
          if (error.fieldErrors?.currentPassword) {
            setPasswordError("currentPassword", { message: error.fieldErrors.currentPassword[0] });
          } else if (error.fieldErrors?.newPassword) {
            setPasswordError("newPassword", { message: error.fieldErrors.newPassword[0] });
          } else {
            setPasswordError("currentPassword", { message: error.message });
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        homeHref={homeHref}
        breadcrumb={[roleLabel, "Settings"]}
        title="Settings"
        subtitle="Manage your account and preferences."
      />

      <Card className="max-w-xl">
        <h2 className="text-sm font-medium text-text-secondary">Profile Information</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Full Name
            </label>
            <Input error={errors.name?.message} {...register("name")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
            <Input value={user.email} disabled />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Role</label>
              <Input value={user.role} disabled className="capitalize" />
            </div>
            {user.branchId && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">
                  Branch
                </label>
                <Input value={branchName} disabled />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isLoading={updateProfile.isPending}>
              Save Changes
            </Button>
            {showSaved && <span className="text-sm text-success">Saved.</span>}
          </div>
        </form>
      </Card>

      <Card className="max-w-xl">
        <h2 className="text-sm font-medium text-text-secondary">Password</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handlePasswordSubmit(onSubmitPassword)}>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              Current Password
            </label>
            <Input
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword("currentPassword")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                New Password
              </label>
              <Input
                type="password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword("newPassword")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Confirm New Password
              </label>
              <Input
                type="password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword("confirmPassword")}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isLoading={changePassword.isPending}>
              Change Password
            </Button>
            {passwordSuccess && (
              <span className="text-sm text-success">Password changed. Signing you out…</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
