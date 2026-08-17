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

// إدارة المستخدمين
await page.goto("http://localhost:3000/users/new", { waitUntil: "networkidle" });
await page.fill("#fullNameAr", "محاسب تجريبي");
await page.fill("#username", "acc1");
await page.fill("#password", "Password123!");
await page.getByRole("checkbox").first().check().catch(() => {});
// اختار أول رول متاح (accountant غالبًا)
const checkboxes = await page.locator('input[name="roleIds"]').all();
if (checkboxes.length > 0) await checkboxes[0].check();
await page.getByRole("button", { name: "إنشاء المستخدم" }).click();
await page.waitForURL(/\/users$/, { timeout: 10000 });
const usersText = await page.locator("body").innerText();
console.log("المستخدم الجديد ظهر في القائمة:", usersText.includes("محاسب تجريبي"));

// تعديل معدة
await page.goto("http://localhost:3000/equipment", { waitUntil: "networkidle" });
await page.locator("a", { hasText: "GEN-001" }).click();
await page.waitForURL(/\/equipment\/[a-z0-9]+$/);
await page.getByRole("button", { name: "تعديل" }).click();
await page.waitForURL(/\/equipment\/[a-z0-9]+\/edit$/);
await page.fill("#notes", "اتفحصت بالكامل");
await page.getByRole("button", { name: "حفظ التعديلات" }).click();
await page.waitForTimeout(1000);
const profileText = await page.locator("body").innerText();
console.log("التعديل اتحفظ:", profileText.includes("اتفحصت بالكامل"));

await page.screenshot({ path: "scripts/out-users-page.png", fullPage: true });

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
