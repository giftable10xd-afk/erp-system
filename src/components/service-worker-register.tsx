"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // تسجيل الـ service worker فشل — مش حرج، النظام شغال عادي أونلاين
      });
      return;
    }

    // في التطوير: chunks بتاعة Turbopack مش content-hashed زي البرودكشن،
    // فأي service worker متسجل من جلسة تطوير سابقة ممكن يفضل يخدّم نسخة
    // قديمة من ملف بنفس الاسم بعد أي إعادة تشغيل للسيرفر — ده اللي حصل
    // فعليًا وسبب hydration mismatch. الحل: نلغي أي تسجيل قديم ونمسح
    // الكاش بتاعه تلقائيًا بدل ما نسيب المستخدم يعمل ده يدويًا من DevTools.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);

  return null;
}
