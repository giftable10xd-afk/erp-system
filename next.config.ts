import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // اتنينهم بيحمّلوا ملفات ثنائية وقت التشغيل (مسار المتصفح)، فلو الـbundler
  // حاول يضمّهم جوه الحزمة المسارات بتتكسر والحجم بيكبر من غير داعي.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // لسه مفيش Sentry auth token — رفع الـsource maps هيتفعّل بعدين لو احتجناه.
  sourcemaps: { disable: true },
});
