import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_* so it's readable in the browser bundle -- there's no secret
// in a Sentry DSN, it's meant to be public (like a Stripe publishable key).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  // Same reasoning as the server config: never capture PII by default. This
  // also disables session replay's default text/media masking exemptions --
  // replay is not enabled here at all, on purpose, since a recorded session
  // of a clinic's dashboard is itself a PII surface.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
