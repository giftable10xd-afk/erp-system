import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("pageerror", (err) => console.log("[page error]", err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("اسم المستخدم").fill("owner");
await page.getByLabel("كلمة المرور").fill("ChangeMe123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL("**/dashboard");

// إنشاء معدة جديدة
await page.goto("http://localhost:3000/equipment/new", { waitUntil: "networkidle" });
await page.fill("#assetTag", "GEN-001");
await page.selectOption("#type", "generator");
await page.fill("#brand", "Cummins");
await page.fill("#model", "C150");
await page.getByRole("button", { name: "حفظ المعدة" }).click();
await page.waitForURL("**/equipment/**", { timeout: 10000 });
console.log("بعد إنشاء المعدة:", page.url());

// إضافة قطعة (فلتر)
await page.fill("#name", "فلتر زيت");
await page.selectOption("#componentType", "filter");
await page.getByRole("button", { name: "إضافة" }).first().click();
await page.waitForTimeout(1000);

const pageText = await page.locator("body").innerText();
console.log("المعدة الجديدة GEN-001 ظاهرة:", pageText.includes("GEN-001"));
console.log("القطعة 'فلتر زيت' ظاهرة:", pageText.includes("فلتر زيت"));

await page.screenshot({ path: "scripts/out-equipment-profile.png", fullPage: true });

// أصناف المخزون
await page.goto("http://localhost:3000/equipment/inventory/new", { waitUntil: "networkidle" });
await page.fill("#sku", "OIL-15W40");
await page.fill("#nameAr", "زيت محرك 15W40");
await page.fill("#unit", "لتر");
await page.fill("#reorderLevel", "20");
await page.getByRole("button", { name: "حفظ الصنف" }).click();
await page.waitForURL("**/equipment/inventory");
console.log("بعد إنشاء الصنف:", page.url());

// توريد كمية
const qtyInput = page.locator('input[name="quantity"]').first();
await qtyInput.fill("100");
await page.getByRole("button", { name: "إضافة" }).first().click();
await page.waitForTimeout(1000);

const invText = await page.locator("body").innerText();
console.log("صنف الزيت ظاهر:", invText.includes("زيت محرك 15W40"));
console.log("الرصيد بعد التوريد يحتوي 100:", invText.includes("100"));

await page.screenshot({ path: "scripts/out-inventory.png", fullPage: true });

await browser.close();
