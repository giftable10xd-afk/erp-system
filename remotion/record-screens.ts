import { chromium } from "@playwright/test";
import { mkdir, rename, readFile } from "node:fs/promises";
import path from "node:path";
import { SCENES } from "./scenes";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "public", "screens");
const VIEWPORT = { width: 1920, height: 1080 };
const BUFFER_MS = 2500; // هامش أمان فوق مدة السرد عشان الفيديو مايخلصش قبل الصوت

async function readManifest() {
  const raw = await readFile(path.join(__dirname, "public", "audio", "manifest.json"), "utf-8");
  return JSON.parse(raw) as { id: string; durationSeconds: number }[];
}

async function paceScroll(page: import("@playwright/test").Page, totalMs: number) {
  const steps = Math.max(4, Math.floor(totalMs / 1400));
  const stepMs = totalMs / steps;
  for (let i = 0; i < steps; i++) {
    const dy = i % 2 === 0 ? 260 : -140;
    await page.mouse.move(960 + (i % 3) * 40, 400 + (i % 4) * 60);
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), dy);
    await page.waitForTimeout(stepMs);
  }
}

async function recordIntro(browser: import("@playwright/test").Browser, targetMs: number, storagePath: string) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  await page.getByLabel("اسم المستخدم").click();
  await page.getByLabel("اسم المستخدم").pressSequentially("owner", { delay: 90 });
  await page.waitForTimeout(300);
  await page.getByLabel("كلمة المرور").click();
  await page.getByLabel("كلمة المرور").pressSequentially("ChangeMe123!", { delay: 90 });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const elapsedSoFar = 900 + 5 * 90 + 300 + 12 * 90 + 500 + 1200;
  const remaining = Math.max(1500, targetMs - elapsedSoFar);
  await paceScroll(page, remaining);

  await context.storageState({ path: storagePath });
  const video = page.video();
  await context.close();
  if (video) {
    const p = await video.path();
    await rename(p, path.join(OUT_DIR, "intro.webm"));
  }
}

async function recordSearch(browser: import("@playwright/test").Browser, targetMs: number, storagePath: string) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    storageState: storagePath,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/search?q=مولد`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const input = page.locator('input[name="q"]');
  await input.click();
  await input.fill("");
  await input.pressSequentially("جرار", { delay: 110 });
  await page.waitForTimeout(500);
  await input.press("Enter");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);

  const elapsedSoFar = 1000 + 4 * 110 + 500 + 1000 + 1000;
  const remaining = Math.max(1500, targetMs - elapsedSoFar);
  await paceScroll(page, remaining);

  const video = page.video();
  await context.close();
  if (video) {
    const p = await video.path();
    await rename(p, path.join(OUT_DIR, "search-permissions.webm"));
  }
}

async function recordGeneric(
  browser: import("@playwright/test").Browser,
  sceneId: string,
  scenePath: string,
  targetMs: number,
  storagePath: string
) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    storageState: storagePath,
  });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${scenePath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  await paceScroll(page, Math.max(1500, targetMs - 900));

  const video = page.video();
  await context.close();
  if (video) {
    const p = await video.path();
    await rename(p, path.join(OUT_DIR, `${sceneId}.webm`));
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await readManifest();
  const storagePath = path.join(OUT_DIR, "..", "storage-state.json");

  const browser = await chromium.launch();

  for (const scene of SCENES) {
    const entry = manifest.find((m) => m.id === scene.id);
    const targetMs = ((entry?.durationSeconds ?? 12) + BUFFER_MS / 1000) * 1000;

    console.log(`recording ${scene.id} (~${(targetMs / 1000).toFixed(1)}s)...`);

    if (scene.id === "intro") {
      await recordIntro(browser, targetMs, storagePath);
    } else if (scene.id === "search-permissions") {
      await recordSearch(browser, targetMs, storagePath);
    } else {
      await recordGeneric(browser, scene.id, scene.path, targetMs, storagePath);
    }
    console.log(`✓ ${scene.id} done`);
  }

  await browser.close();
  console.log("\nكل تسجيلات الشاشة اتعملت");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
