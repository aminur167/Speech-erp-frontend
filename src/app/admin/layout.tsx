"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { adminNav } from "@/config/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingState } from "@/components/ui/states";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthGuard("admin");

  if (!isAuthenticated || user?.role !== "admin") {
    return <LoadingState label="Checking your session…" />;
  }

  return <AppShell navItems={adminNav}>{children}</AppShell>;
}
