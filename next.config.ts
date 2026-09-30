import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The Package Requests page was folded into Services, where each
      // request is decided from its package's own row. Notifications sent
      // before that still link here, so send them to where the request is.
      {
        source: "/admin/package-requests",
        destination: "/admin/services",
        permanent: false,
      },
    ];
  },
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
