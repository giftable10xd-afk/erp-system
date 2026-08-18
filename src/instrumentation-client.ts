import * as Sentry from "@sentry/nextjs";

// العميل — الـDSN من NEXT_PUBLIC_SENTRY_DSN (بادئة NEXT_PUBLIC_ لازمة عشان
// المتغير يوصل لكود المتصفح، مش سري زي DATABASE_URL).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  enabled: process.env.NODE_ENV === "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
