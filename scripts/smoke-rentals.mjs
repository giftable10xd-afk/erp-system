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

// إضافة عميل
await page.goto("http://localhost:3000/rentals/customers/new", { waitUntil: "networkidle" });
await page.fill("#nameAr", "شركة النور للمقاولات");
await page.fill("#phone", "01012345678");
await page.getByRole("button", { name: "حفظ العميل" }).click();
await page.waitForURL(/\/rentals\/new\?customerId=/);
console.log("بعد إضافة العميل، اتحول لصفحة عقد جديد:", page.url());

// إنشاء عقد إيجار
await page.selectOption("#equipmentId", { index: 1 });
const today = new Date().toISOString().slice(0, 10);
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
await page.fill("#startDate", today);
await page.fill("#expectedReturnDate", future);
await page.fill("#rateAmount", "500");
await page.getByRole("button", { name: "إنشاء العقد" }).click();
await page.waitForURL(/\/rentals\/[a-z0-9]+$/, { timeout: 10000 });
const contractUrl = page.url();
console.log("بعد إنشاء العقد:", contractUrl);

const contractText = await page.locator("body").innerText();
console.log("العقد يعرض العميل:", contractText.includes("شركة النور للمقاولات"));
console.log("العقد قائم (active):", contractText.includes("قائم"));

// تحقق إن المعدة بقت status=rented في صفحة المعدات
await page.goto("http://localhost:3000/equipment", { waitUntil: "networkidle" });
const equipText = await page.locator("body").innerText();
console.log("في معدة واحدة على الأقل مؤجرة دلوقتي:", equipText.includes("مؤجرة"));

// إنهاء العقد (استلام المعدة) والتأكد إن المعدة بترجع active
await page.goto(contractUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "تسجيل استلام المعدة (إنهاء العقد)" }).click();
await page.waitForTimeout(1000);
const afterReturnText = await page.locator("body").innerText();
console.log("العقد بقى منتهي بعد الاستلام:", afterReturnText.includes("منتهي"));

await page.goto("http://localhost:3000/equipment", { waitUntil: "networkidle" });
const equipAfterText = await page.locator("body").innerText();
console.log("مفيش معدات مؤجرة دلوقتي (رجعت active):", !equipAfterText.includes("مؤجرة"));

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
