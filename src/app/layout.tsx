import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Fira_Sans, Big_Shoulders } from "next/font/google";
import "./globals.css";

// ملحوظة: خط Decotype Naskh Special (المستخدم في كل الموقع — عناوين ونصوص،
// بناءً على طلب المستخدم) متحمّل بـ @font-face عادي في globals.css مش
// next/font/local — next/font بيعمل subsetting/معالجة للخط، وكان في مشكلة
// بينت لما جربناه مع الملف ده تحديدًا. الخط اللاتيني (Fira Sans) للأكواد
// والأرقام التقنية بس مش متأثر فنسيبه على next/font/google العادي.
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ltr-technical",
  display: "swap",
});

// خط Big Shoulders — مضغوط صناعي (مستوحى من لافتات شيكاغو الصناعية)،
// مخصص لكود الأصل/المعدّة (asset tag) بس عبر .ltr-technical-display، مش
// للأرقام العادية اللي لازم تفضل عربية بخط Naskh. راجع globals.css.
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-ltr-display-face",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة الشركة",
  description: "نظام ERP لإدارة المخزون والصيانة والموارد البشرية والمحاسبة والإيجارات",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f2efea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${firaSans.variable} ${bigShoulders.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
THESIS: kill the generic-blue-SaaS dashboard rut; the ERP reads as the fleet's own instrument panel, not a finance app wearing industrial icons.
OWN-WORLD: warm light steel ground (switched from graphite to light mode per user request), one committed safety-yellow accent spent only on priority/active states, dark warm-charcoal type, light-tinted category icon chips, a yellow/charcoal hazard-chevron stripe marking urgency structurally, Big Shoulders for asset-tag codes and Latin-digit KPI numerals.
STORY: staff read the dashboard like a fleet status board — what's running, late, or needs them — with yellow marking exactly what needs action now.
FIRST VIEWPORT: graphite hero panel with a yellow edge accent, eight rating-plate KPI tiles (three carrying the hazard mark), sidebar recast as a dark instrument rail with a yellow indicator light on the active item.
FORM: Industrial Fleet Livery — direction 7 of 7 grounded candidates, concept-seed key 867b4ec1.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
        */}
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
