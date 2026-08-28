"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import type { NavItem } from "@/config/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
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
