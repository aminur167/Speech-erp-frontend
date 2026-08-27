"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { managerNav } from "@/config/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingState } from "@/components/ui/states";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthGuard("manager");

  if (!isAuthenticated || user?.role !== "manager") {
    return <LoadingState label="Checking your session…" />;
  }

  return <AppShell navItems={managerNav}>{children}</AppShell>;
}
