import "server-only";
import { chromium, type Browser } from "playwright";

// نسخة واحدة من المتصفح تتشارك بين كل طلبات توليد الـ PDF بدل ما نفتح
// متصفح جديد كل مرة (تكلفة إطلاق Chromium عالية).
let browserPromise: Promise<Browser> | null = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
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
