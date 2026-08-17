import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
const issues = [];
page.on("console", (msg) => { if (msg.type() === "error") issues.push(msg.text()); });
page.on("pageerror", (err) => issues.push(err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("اسم المستخدم").fill("owner");
await page.getByLabel("كلمة المرور").fill("ChangeMe123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL("**/dashboard");

await page.goto("http://localhost:3000/accounting/new", { waitUntil: "networkidle" });
await page.selectOption("#customerId", { index: 1 });
await page.fill('input[name="lineDescription"]', "صيانة دورية");
await page.fill('input[name="lineQuantity"]', "1");
await page.fill('input[name="lineUnitPrice"]', "1000");
await page.fill('input[name="lineTaxRate"]', "14");
await page.getByRole("button", { name: "حفظ الفاتورة (مسودة)" }).click();
await page.waitForURL(/\/accounting\/[a-z0-9]+$/, { timeout: 10000 });
const invoiceUrl = page.url();
console.log("بعد إنشاء الفاتورة:", invoiceUrl);

let text = await page.locator("body").innerText();
console.log("الفاتورة مسودة:", text.includes("مسودة"));
console.log("الإجمالي محسوب صح (1140 = 1000+14%):", text.includes("١٬١٤٠"));

await page.getByRole("button", { name: "إصدار الفاتورة" }).click();
await page.waitForTimeout(1000);
text = await page.locator("body").innerText();
console.log("الفاتورة بقت صادرة:", text.includes("صادرة"));

await page.fill('input[name="amount"]', "1140");
await page.selectOption('select[name="method"]', "cash");
await page.getByRole("button", { name: "تسجيل الدفعة" }).click();
await page.waitForTimeout(1000);
text = await page.locator("body").innerText();
console.log("الفاتورة بقت مدفوعة بالكامل:", text.includes("مدفوعة"));

// اختبار توليد الـ PDF
const pdfResponse = await page.request.get(invoiceUrl.replace("/accounting/", "/api/invoices/") + "/pdf");
console.log("PDF status:", pdfResponse.status());
console.log("PDF content-type:", pdfResponse.headers()["content-type"]);
const buffer = await pdfResponse.body();
console.log("PDF size (bytes):", buffer.length);
console.log("PDF بيبدأ بتوقيع %PDF صحيح:", buffer.slice(0, 4).toString() === "%PDF");

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
