import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // لسه مفيش Sentry auth token — رفع الـsource maps هيتفعّل بعدين لو احتجناه.
  sourcemaps: { disable: true },
});
