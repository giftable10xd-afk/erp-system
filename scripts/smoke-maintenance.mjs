import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const issues = [];
page.on("console", (msg) => { if (msg.type() === "error") issues.push(msg.text()); });
page.on("pageerror", (err) => issues.push(err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("اسم المستخدم").fill("owner");
await page.getByLabel("كلمة المرور").fill("ChangeMe123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL("**/dashboard");

// تحقق من الرصيد قبل الصيانة
await page.goto("http://localhost:3000/equipment/inventory", { waitUntil: "networkidle" });
const beforeText = await page.locator("body").innerText();
console.log("قبل الصيانة - يحتوي على ١٠٠:", beforeText.includes("١٠٠"));

// تسجيل صيانة تستهلك 30 لتر زيت
await page.goto("http://localhost:3000/maintenance/new", { waitUntil: "networkidle" });
await page.selectOption("#equipmentId", { index: 0 });
await page.selectOption("#jobType", "routine");
await page.fill("#description", "تغيير زيت المحرك - اختبار الربط الذري");

await page.locator('select[name="partInventoryItemId"]').first().selectOption({ index: 1 });
await page.locator('input[name="partQuantity"]').first().fill("30");

// إضافة قطعة اتصانت (فلتر الزيت)
await page.getByRole("button", { name: "إضافة قطعة" }).click();
await page.locator('select[name="componentId"]').first().selectOption({ index: 1 });

await page.getByRole("button", { name: "تسجيل الصيانة" }).click();
await page.waitForURL(/\/maintenance\/(?!new)[a-z0-9]+$/, { timeout: 10000 });
console.log("بعد تسجيل الصيانة:", page.url());

const jobPageText = await page.locator("body").innerText();
console.log("صفحة الصيانة تحتوي على 'تغيير زيت المحرك':", jobPageText.includes("تغيير زيت المحرك"));
console.log("صفحة الصيانة تحتوي على القطعة المستهلكة:", jobPageText.includes("زيت محرك"));
console.log("صفحة الصيانة تحتوي على ٣٠:", jobPageText.includes("٣٠"));

await page.screenshot({ path: "scripts/out-maintenance-job.png", fullPage: true });

// تحقق من خصم المخزون أوتوماتيك (100 - 30 = 70)
await page.goto("http://localhost:3000/equipment/inventory", { waitUntil: "networkidle" });
const afterText = await page.locator("body").innerText();
console.log("بعد الصيانة - الرصيد بقى ٧٠:", afterText.includes("٧٠"));
console.log("بعد الصيانة - الرصيد القديم ١٠٠ اختفى:", !afterText.includes("١٠٠"));

// تحقق من ظهور العملية في تاريخ المعدة نفسها
await page.goto("http://localhost:3000/equipment", { waitUntil: "networkidle" });
await page.locator("a", { hasText: "GEN-001" }).click();
await page.waitForURL(/equipment\/[a-z0-9]+$/);
const equipPageText = await page.locator("body").innerText();
console.log("سجل المعدة يعرض الصيانة تلقائيًا (زيت محرك):", equipPageText.includes("زيت محرك"));
console.log("سجل المعدة يعرض اسم المهندس (المالك):", equipPageText.includes("المالك"));

await page.screenshot({ path: "scripts/out-equipment-history.png", fullPage: true });

console.log("\n--- console/page issues ---");
console.log(issues.join("\n") || "(none)");

await browser.close();
