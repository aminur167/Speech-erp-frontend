"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types/domain";

export function dashboardPathForRole(role: UserRole): string {
  return role === "admin" ? "/admin/dashboard" : "/manager/dashboard";
}

/**
 * Client-side route guard. Redirects to /login when unauthenticated, or to the
 * user's own dashboard when they're authenticated but hit the wrong role's routes.
 *
 * NOTE: this is a client-only guard (auth state lives in memory via Zustand, not
 * a cookie), which is fine for now since there's no real backend yet. Once the
 * Django backend issues an httpOnly session cookie, add matching protection in
 * middleware.ts so unauthenticated requests never reach the page at all.
 */
export function useAuthGuard(requiredRole?: UserRole) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isAuthenticated, user, requiredRole, router]);

  return { user, isAuthenticated };
}
