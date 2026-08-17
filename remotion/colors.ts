// نفس لوحة الألوان المستخدمة في globals.css بتاع الموقع — بنكررها هنا كـ
// ثوابت لأن Remotion بيترندر في سياق منفصل عن Tailwind الخاص بموقع Next.js
export const COLORS = {
  background: "#f8fafc",
  primary: "#1e40af",
  primaryForeground: "#ffffff",
  sidebar: "#0f2461",
  headingForeground: "#1e3a8a",
  foreground: "#0f172a",
} as const;

export const BADGE_COLORS = {
  blue: { fg: "#1e40af", bg: "#dbeafe" },
  amber: { fg: "#d97706", bg: "#fef3c7" },
  green: { fg: "#16a34a", bg: "#dcfce7" },
  violet: { fg: "#7c3aed", bg: "#ede9fe" },
  pink: { fg: "#db2777", bg: "#fce7f3" },
  cyan: { fg: "#0891b2", bg: "#cffafe" },
} as const;
