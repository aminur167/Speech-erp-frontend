"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Lock, AlertTriangle, LogOut, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { logout as logoutOnServer } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile } from "@/hooks/auth/useUpdateProfile";
import { useChangePassword } from "@/hooks/auth/useChangePassword";
import { useCurrentBranchName } from "@/hooks/branches/useCurrentBranchName";
import { useSystemSettings } from "@/hooks/settings/useSystemSettings";
import { useUpdateSystemSettings } from "@/hooks/settings/useUpdateSystemSettings";
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

const attendanceSchema = z.object({
  stoppedComingAfterDays: z
    .string()
    .min(1, "Enter a number of days.")
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 365,
      "Enter a whole number of days, from 1 to 365.",
    ),
});
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

type PanelKey = "profile" | "password" | "attendance";

/** One Facebook-style settings row: an icon, a title and description, and a chevron — the whole thing opens a modal. */
function SettingsRow({
  icon: Icon,
  title,
  description,
  onClick,
  danger,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-border/60 px-5 py-4 text-left transition-colors last:border-0 hover:bg-primary-light/40 focus:outline-none focus-visible:bg-primary-light/40"
    >
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
          (danger ? "bg-danger/10 text-danger" : "bg-primary-light text-primary")
        }
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={"font-medium " + (danger ? "text-danger" : "text-text-primary")}>{title}</p>
        <p className="truncate text-sm text-text-secondary">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
    </button>
  );
}

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
  const isAdmin = user?.role === "admin";
  const { data: systemSettings } = useSystemSettings();
  const updateSystemSettingsMutation = useUpdateSystemSettings();

  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

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

  const {
    register: registerAttendance,
    handleSubmit: handleAttendanceSubmit,
    formState: { errors: attendanceErrors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    values: systemSettings
      ? { stoppedComingAfterDays: String(systemSettings.stoppedComingAfterDays) }
      : undefined,
  });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    void logoutOnServer();
    router.push("/login");
  };

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      { userId: user.id, name: values.name },
      { onSuccess: () => setOpenPanel(null) },
    );
  };

  const onSubmitPassword = (values: PasswordFormValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          resetPasswordForm();
          setOpenPanel(null);
          // Changing a password ends every other session too (server-side
          // blacklist), including this one's refresh token -- sign out
          // cleanly here rather than let this tab discover that the next
          // time it tries to refresh.
          setTimeout(handleLogout, 1800);
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

  const onSubmitAttendance = (values: AttendanceFormValues) => {
    updateSystemSettingsMutation.mutate(
      { stoppedComingAfterDays: Number(values.stoppedComingAfterDays) },
      { onSuccess: () => setOpenPanel(null) },
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

      <Card padding="none" className="max-w-xl overflow-hidden py-1">
        <SettingsRow
          icon={User}
          title="Profile Information"
          description="Your name, email, role and branch"
          onClick={() => setOpenPanel("profile")}
        />
        <SettingsRow
          icon={Lock}
          title="Password"
          description="Change the password you sign in with"
          onClick={() => setOpenPanel("password")}
        />
        {isAdmin && (
          <SettingsRow
            icon={AlertTriangle}
            title="Attendance Alerts"
            description="Days without a visit before a patient is flagged as having stopped coming"
            onClick={() => setOpenPanel("attendance")}
          />
        )}
        <SettingsRow
          icon={LogOut}
          title="Log Out"
          description="Sign out of this session"
          onClick={() => setConfirmingLogout(true)}
          danger
        />
      </Card>

      <Modal
        open={openPanel === "profile"}
        onClose={() => setOpenPanel(null)}
        title="Profile Information"
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" isLoading={updateProfile.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={openPanel === "password"}
        onClose={() => setOpenPanel(null)}
        title="Password"
        description="You'll be signed out everywhere once it's changed."
      >
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit(onSubmitPassword)}>
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" isLoading={changePassword.isPending}>
              Change Password
            </Button>
          </div>
        </form>
      </Modal>

      {isAdmin && (
        <Modal
          open={openPanel === "attendance"}
          onClose={() => setOpenPanel(null)}
          title="Attendance Alerts"
          description="Applies across every branch — a Manager's sheet is measured against this same number."
        >
          <form className="flex flex-col gap-4" onSubmit={handleAttendanceSubmit(onSubmitAttendance)}>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Flag as stopped coming after (days)
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                error={attendanceErrors.stoppedComingAfterDays?.message}
                {...registerAttendance("stoppedComingAfterDays")}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit" isLoading={updateSystemSettingsMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmingLogout}
        onClose={() => setConfirmingLogout(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You'll need to sign in again to continue."
        confirmLabel="Log Out"
        danger
      />
    </div>
  );
}
