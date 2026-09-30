"use client";

import { useEffect, type ReactNode } from "react";
import { clsx } from "clsx";
import { useQueryClient } from "@tanstack/react-query";
import type { NavItem } from "@/config/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useApprovalPulse } from "@/hooks/useApprovalPulse";
import { warmRoutes } from "@/lib/routePrefetch";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

export function AppShell({
  navItems,
  contextLabel,
  banner,
  children,
}: {
  navItems: NavItem[];
  /** Overrides the sidebar's branch-name subtitle — used when Admin is browsing a specific branch. */
  contextLabel?: string;
  /** Optional strip rendered above page content, e.g. an "Admin viewing X" notice. */
  banner?: ReactNode;
  children: ReactNode;
}) {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Approval queues and badges follow the server within seconds.
  useApprovalPulse();

  // Every sidebar page's first data, loaded quietly in the background after
  // sign-in, so the first click on any of them is instant.
  useEffect(() => {
    warmRoutes(queryClient, navItems, user);
  }, [queryClient, navItems, user]);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar items={navItems} contextLabel={contextLabel} />
      <div
        className={clsx(
          "flex h-full min-w-0 flex-col transition-[margin] duration-200",
          isCollapsed ? "md:ml-[68px]" : "md:ml-64",
        )}
      >
        <Topbar />
        {banner}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
