"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { adminNav, branchNav } from "@/config/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useBranches } from "@/hooks/branches/useBranches";
import { LoadingState } from "@/components/ui/states";

function useBranchViewContext() {
  const pathname = usePathname();
  const match = pathname.match(/^\/admin\/branches\/([^/]+)/);
  const branchId = match?.[1];
  const { data: branches } = useBranches(Boolean(branchId));
  const branch = branchId ? branches?.find((b) => b.id === branchId) : undefined;
  return { branchId, branch };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthGuard("admin");
  const { branchId, branch } = useBranchViewContext();

  if (!isAuthenticated || user?.role !== "admin") {
    return <LoadingState label="Checking your session…" />;
  }

  const navItems = branchId ? branchNav(branchId) : adminNav;
  const contextLabel = branchId ? (branch?.name ?? "Loading branch…") : undefined;

  return (
    <AppShell
      navItems={navItems}
      contextLabel={contextLabel}
      banner={
        branchId && (
          <div className="flex shrink-0 items-center gap-2 border-b border-primary/20 bg-primary-light/40 px-4 py-2 text-xs text-primary-dark md:px-8">
            <span className="font-medium">
              Admin view — browsing {branch?.name ?? "this branch"} as an administrator
            </span>
            <Link
              href="/admin/branches"
              className="ml-auto flex items-center gap-1 font-medium hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Exit to all branches
            </Link>
          </div>
        )
      }
    >
      {children}
    </AppShell>
  );
}
