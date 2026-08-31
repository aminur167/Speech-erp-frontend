import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Only a Node.js server target -- this app has no middleware/edge routes,
  // so there's no edge runtime to instrument.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
