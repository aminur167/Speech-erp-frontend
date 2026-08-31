"use client";

import { Menu, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout as logoutOnServer } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import { useBranches } from "@/hooks/branches/useBranches";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toggleMobileSidebar = useUiStore((state) => state.toggleMobileSidebar);

  const isManager = user?.role === "manager";
  const { data: branches } = useBranches(isManager);
  const branchName = isManager ? branches?.find((b) => b.id === user?.branchId)?.name : undefined;

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/logo.png" alt="Therapy Lab" width={28} height={28} className="rounded-full" />
        <span className="text-sm font-semibold text-primary-dark">Speech Therapy Lab</span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-text-primary">{user?.name}</p>
          <p className="text-xs capitalize text-text-secondary">
            {user?.role}
            {branchName && <span> · {branchName}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            // Clear local state immediately so the UI reacts instantly; the
            // server-side blacklist call is best-effort and must never block
            // getting the user off a screen they think is already logged out.
            logout();
            router.push("/login");
            void logoutOnServer();
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-text-primary"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
