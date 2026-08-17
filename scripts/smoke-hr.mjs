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

// إضافة موظف
await page.goto("http://localhost:3000/hr/employees/new", { waitUntil: "networkidle" });
await page.fill("#fullNameAr", "أحمد محمد");
await page.fill("#position", "مهندس صيانة");
await page.fill("#hireDate", "2024-01-15");
await page.fill("#baseSalary", "8000");
await page.getByRole("button", { name: "حفظ الموظف" }).click();
await page.waitForURL("**/hr");
console.log("بعد إضافة الموظف:", page.url());
const hrText = await page.locator("body").innerText();
console.log("الموظف ظاهر في القائمة:", hrText.includes("أحمد محمد"));

// تسجيل حضور
await page.goto("http://localhost:3000/hr/attendance", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "حاضر" }).click();
await page.waitForTimeout(1000);
const attText = await page.locator("body").innerText();
console.log("حالة الحضور اتسجلت:", attText.includes("حاضر"));

// إنشاء مرتبات الشهر
await page.goto("http://localhost:3000/hr/payroll", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "إنشاء سجلات الشهر" }).click();
await page.waitForTimeout(1000);
const payrollText = await page.locator("body").innerText();
console.log("سجل مرتب الموظف ظهر:", payrollText.includes("أحمد محمد"));
console.log("المرتب الأساسي ظاهر (٨٠٠٠):", payrollText.includes("٨٠٠٠") || payrollText.includes("8000"));

// فتح سجل المرتب وإضافة خصم
await page.getByRole("link", { name: "أحمد محمد" }).click();
await page.waitForURL(/\/hr\/payroll\/[a-z0-9]+$/);
await page.fill('input[name="reason"]', "تأخير");
await page.fill('input[name="amount"]', "200");
await page.getByRole("button", { name: "إضافة خصم" }).click();
await page.waitForTimeout(1000);
const detailText = await page.locator("body").innerText();
console.log("الخصم اتسجل:", detailText.includes("تأخير"));
console.log("الصافي اتحدث (المفروض ٧٨٠٠):", detailText.includes("٧٨٠٠"));

await page.screenshot({ path: "scripts/out-payroll-detail.png", fullPage: true });

console.log("\nissues:", issues.join("\n") || "(none)");
await browser.close();
