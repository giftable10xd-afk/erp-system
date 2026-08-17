import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console error]", msg.text());
});
page.on("pageerror", (err) => console.log("[page error]", err.message));

await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
console.log("بعد التوجيه من /:", page.url());

await page.screenshot({ path: "scripts/out-login.png" });

await page.getByLabel("اسم المستخدم").fill("owner");
await page.getByLabel("كلمة المرور").fill("ChangeMe123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();

await page.waitForURL("**/dashboard", { timeout: 10000 });
console.log("بعد تسجيل الدخول:", page.url());

const bodyText = await page.locator("body").innerText();
console.log("عنوان الصفحة:", await page.title());
console.log("محتوى الداشبورد يحتوي على 'مرحبًا':", bodyText.includes("مرحبًا"));
console.log("السايدبار يحتوي على 'المخزون والمعدات':", bodyText.includes("المخزون والمعدات"));

await page.screenshot({ path: "scripts/out-dashboard.png", fullPage: true });

// تحقق من اتجاه RTL فعليًا على مستوى الـ computed style
const dir = await page.evaluate(() => document.documentElement.dir);
const lang = await page.evaluate(() => document.documentElement.lang);
console.log("dir:", dir, "lang:", lang);

await browser.close();
