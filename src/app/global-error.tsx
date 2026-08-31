"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches errors thrown during root layout rendering -- the one place a
 * normal error.tsx boundary can't reach, since it lives inside the layout
 * it would need to replace. Without this, a crash here never reaches
 * Sentry at all.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-500">
            The error has been reported. Please refresh the page.
          </p>
        </div>
      </body>
    </html>
  );
}
