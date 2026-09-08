"use client";

import { useEffect, useState } from "react";
import { restoreSession } from "@/lib/api/auth";

/**
 * Restores a session from the persisted refresh token before rendering
 * anything else. Without this gate, `useAuthGuard` would redirect every
 * reload to /login (isAuthenticated starts false) and only populate the real
 * session a moment later — the user would see a flash of the login page, or
 * worse, land on it, on every refresh of an otherwise-valid session.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return children;
}
