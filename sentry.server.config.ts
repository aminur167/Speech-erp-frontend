import * as Sentry from "@sentry/nextjs";

// Mirrors the backend's philosophy (config/settings/production.py): warn
// rather than crash if the DSN isn't configured yet -- a clinic's first
// deploy shouldn't be blocked on having Sentry set up, and Sentry.init with
// an empty/undefined dsn is a documented no-op, not an error.
Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  // Patient names, phone numbers, and financial details pass through this
  // app constantly -- never let Sentry capture request bodies/headers/IPs
  // by default, matching send_default_pii=False on the backend.
  sendDefaultPii: false,
});
