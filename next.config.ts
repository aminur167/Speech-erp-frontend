import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Only used at build time to upload source maps for readable stack
  // traces in Sentry -- silently skipped (with a warning, not an error)
  // when these aren't set, so an org/project without Sentry configured yet
  // still builds normally.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
