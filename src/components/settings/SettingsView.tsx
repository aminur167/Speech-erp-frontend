"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/auth/useUpdateProfile";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsView({
  homeHref,
  roleLabel,
}: {
  homeHref: string;
  roleLabel: string;
}) {
  const user = useAuthStore((state) => state.user);
  const branchName = useCurrentBranchName();
  const updateProfile = useUpdateProfile();
  const [showSaved, setShowSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

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
        <p className="mt-2 text-sm text-text-secondary">
          Password changes are managed by your organization administrator once the backend is
          connected.
        </p>
      </Card>
    </div>
  );
}
