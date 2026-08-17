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
await page.waitForTimeout(1000);

// تحقق من تسجيل الـ service worker
const swRegistered = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return false;
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.length > 0;
});
console.log("service worker اتسجل:", swRegistered);

// البحث الشامل عن "GEN-001"
await page.fill('input[name="q"]', "GEN-001");
await page.keyboard.press("Enter");
await page.waitForURL(/\/search\?q=/);
await page.waitForTimeout(500);
const searchText = await page.locator("body").innerText();
console.log("نتائج البحث تحتوي على المعدة GEN-001:", searchText.includes("GEN-001"));
console.log("قسم 'المعدات' ظهر:", searchText.includes("المعدات"));

// بحث جزئي (fuzzy) بجزء من اسم صنف مخزون
await page.fill('input[name="q"]', "زيت");
await page.keyboard.press("Enter");
await page.waitForURL(/\/search\?q=/);
await page.waitForTimeout(500);
const partialText = await page.locator("body").innerText();
console.log("البحث الجزئي 'زيت' لقى صنف المخزون:", partialText.includes("زيت محرك"));

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
