/**
 * نسخة احتياطية من بيانات قاعدة البيانات لملف JSON على جهازك.
 *
 *   npm run backup
 *
 * بيستخدم درايفر pg الموجود أصلًا في المشروع، فبيشتغل مع أي إصدار Postgres
 * (Neon حاليًا على 18) من غير ما تحتاج تثبّت أدوات إضافية.
 *
 * الهيكل نفسه (الجداول والأعمدة) متولّد من prisma/migrations، فالاسترجاع =
 * `prisma migrate deploy` عشان يبني الجداول، وبعدها `npm run restore` عشان
 * يرجّع البيانات.
 */
import { readFileSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = readFileSync(".env", "utf8").match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) {
  console.error("مفيش DATABASE_URL في ملف .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

// الجداول اللي بيديرها Prisma بس — بنسيب _prisma_migrations لأن الاسترجاع
// بيعيد تشغيل المigrations من الأول.
const { rows: tables } = await client.query(`
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  ORDER BY tablename`);

const dump = {};
let total = 0;

for (const { tablename } of tables) {
  // اسم الجدول جاي من كتالوج Postgres نفسه مش من إدخال المستخدم، وبنغلّفه
  // بعلامات اقتباس عشان الأسماء الحساسة لحالة الحروف زي "user".
  const { rows } = await client.query(`SELECT * FROM public."${tablename}"`);
  dump[tablename] = rows;
  total += rows.length;
  if (rows.length) console.log(`  ${tablename.padEnd(26)} ${rows.length}`);
}

await client.end();

mkdirSync("backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outFile = join("backups", `erp-backup-${stamp}.json`);

writeFileSync(
  outFile,
  JSON.stringify({ takenAt: new Date().toISOString(), tables: dump }, null, 2)
);

const kb = (statSync(outFile).size / 1024).toFixed(0);
console.log(`\nتمت النسخة: ${outFile}`);
console.log(`${tables.length} جدول، ${total} صف، ${kb} KB`);
