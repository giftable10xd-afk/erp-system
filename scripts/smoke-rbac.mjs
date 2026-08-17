import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const issues = [];
page.on("console", (msg) => { if (msg.type() === "error") issues.push(msg.text()); });
page.on("pageerror", (err) => issues.push(err.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("اسم المستخدم").fill("eng1");
await page.getByLabel("كلمة المرور").fill("Engineer123!");
await page.getByRole("button", { name: "تسجيل الدخول" }).click();
await page.waitForURL((url) => url.pathname !== "/login", { timeout: 10000 });
console.log("بعد تسجيل دخول المهندس اتحول لـ:", page.url());
await page.waitForTimeout(500);

const navText = await page.locator("nav").innerText();
console.log("---سايدبار المهندس---");
console.log(navText);
console.log("مايشوفش 'المحاسبة والفوترة':", !navText.includes("المحاسبة والفوترة"));
console.log("مايشوفش 'الموارد البشرية':", !navText.includes("الموارد البشرية"));
console.log("مايشوفش 'لوحة التحكم':", !navText.includes("لوحة التحكم"));
console.log("بيشوف 'الصيانة':", navText.includes("الصيانة"));
console.log("بيشوف 'المخزون والمعدات':", navText.includes("المخزون والمعدات"));

// محاولة الوصول المباشر لصفحة محاسبة رغم عدم وجودها في القائمة
await page.goto("http://localhost:3000/accounting", { waitUntil: "networkidle" });
const blockedText = await page.locator("body").innerText();
console.log("\nمحاولة فتح /accounting مباشرة اتمنعت:", blockedText.includes("غير مصرح"));

// محاولة فتح /dashboard (owner-only) مباشرة
await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
const dashBlockedText = await page.locator("body").innerText();
console.log("محاولة فتح /dashboard مباشرة اتمنعت:", dashBlockedText.includes("غير مصرح"));

// التأكد إن المهندس يقدر يوصل لصفحة الصيانة بتاعته عادي
await page.goto("http://localhost:3000/maintenance", { waitUntil: "networkidle" });
const maintText = await page.locator("body").innerText();
console.log("المهندس يقدر يوصل لصفحة الصيانة عادي:", maintText.includes("الصيانة"));

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
