import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const issues = [];
page.on("console", (msg) => { if (msg.type() === "error") issues.push(msg.text()); });
page.on("pageerror", (err) => issues.push(err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("اسم المستخدم").fill("owner");
await page.getByLabel("كلمة المرور").fill("ChangeMe123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL("**/dashboard");

await page.goto("http://localhost:3000/support/new", { waitUntil: "networkidle" });
await page.fill("#subject", "المولد بيسخن بسرعة");
await page.selectOption("#priority", "high");
await page.selectOption("#equipmentId", { index: 1 });
await page.getByRole("button", { name: "إنشاء الطلب" }).click();
await page.waitForURL(/\/support\/(?!new)[a-z0-9]+$/, { timeout: 10000 });
console.log("بعد إنشاء الطلب:", page.url());

let text = await page.locator("body").innerText();
console.log("الطلب يعرض الموضوع:", text.includes("المولد بيسخن بسرعة"));

await page.fill('input[name="body"]', "المهندس هيروح يشوفه بكرة الصبح");
await page.getByRole("button", { name: "إرسال" }).click();
await page.waitForTimeout(1000);
text = await page.locator("body").innerText();
console.log("التعليق ظهر:", text.includes("المهندس هيروح يشوفه بكرة الصبح"));

await page.selectOption("select", { label: "تم الحل" }).catch(() => {});
await page.waitForTimeout(1000);
text = await page.locator("body").innerText();
console.log("الحالة اتحدثت لـ 'تم الحل':", text.includes("تم الحل"));

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
