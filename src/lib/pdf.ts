import "server-only";
// playwright-core مش playwright: نفس الـAPI بالظبط، بس من غير سكربت تنزيل
// المتصفحات (~400MB) اللي بيتنفّذ مع التثبيت. على Vercel المتصفح بييجي من
// @sparticuz/chromium، وعلى السيرفرات العادية بييجي من `playwright install`
// اللي بيتنفّذ وقت البناء — فالحزمة الكاملة مالهاش لزوم وقت التشغيل.
import { chromium, type Browser, type LaunchOptions } from "playwright-core";

// نسخة واحدة من المتصفح تتشارك بين كل طلبات توليد الـ PDF بدل ما نفتح
// متصفح جديد كل مرة (تكلفة إطلاق Chromium عالية).
let browserPromise: Promise<Browser> | null = null;

// على Vercel مفيش Chromium متثبت في بيئة التشغيل (serverless)، فبنحمّل نسخة
// @sparticuz/chromium المبنية لـLambda ونمرّر مسارها. على أي سيرفر عادي
// (Render أو التطوير المحلي) بنسيب playwright يستخدم المتصفح المتثبت عنده
// زي ما هو — نفس السلوك اللي شغال دلوقتي بالظبط.
async function launchOptions(): Promise<LaunchOptions> {
  if (!process.env.VERCEL) {
    return { headless: true };
  }

  const { default: sparticuz } = await import("@sparticuz/chromium");
  return {
    args: sparticuz.args,
    executablePath: await sparticuz.executablePath(),
    headless: true,
  };
}

function getBrowser() {
  if (!browserPromise) {
    // لو الإطلاق فشل، امسح الـpromise عشان الطلب اللي بعده يحاول من جديد
    // بدل ما يفضل متعلق بنفس الفشل المخزَّن.
    browserPromise = launchOptions()
      .then((options) => chromium.launch(options))
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

export async function renderPdfFromUrl(url: string, cookieHeader: string) {
  const browser = await getBrowser();
  const context = await browser.newContext({ extraHTTPHeaders: { cookie: cookieHeader } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });
    return pdfBuffer;
  } finally {
    await context.close();
  }
}
