import * as Sentry from "@sentry/nextjs";

// السيرفر بس — الـDSN من env var مش هارد كودد، عشان محلي ميبعتش أحداث لـ Sentry
// أثناء التطوير غير لو حد ضبط SENTRY_DSN عمدًا.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: process.env.NODE_ENV === "production",
});
