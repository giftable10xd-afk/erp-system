import type { PermissionKey } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

// أسماء الأيقونات بس (مش الكومبوننت نفسه) — عشان NAV_ITEMS يفضل serializable
// وينفع يتمرر لكومبوننت client (السايدبار محتاج usePathname للـ active state).
// الأسماء دي بتتحل لأيقونات Lucide فعلية جوه sidebar-nav.tsx.
export type NavIconName =
  | "LayoutDashboard"
  | "Package"
  | "Wrench"
  | "Users"
  | "Receipt"
  | "FileSpreadsheet"
  | "LifeBuoy"
  | "Handshake"
  | "Bell"
  | "ShieldCheck"
  | "Settings"
  | "Wallet";

export type NavItem = {
  href: string;
  labelAr: string;
  icon: NavIconName;
  /** null = متاح لأي مستخدم داخل بغض النظر عن الصلاحيات */
  permission: PermissionKey | null;
};

export function getDefaultLandingPath(permissions: Set<string>) {
  const firstAccessible = NAV_ITEMS.find(
    (item) => item.permission === null || permissions.has(item.permission)
  );
  return firstAccessible?.href ?? "/login";
}

// كل موديول بيتضاف هنا أول ما يتبني — القائمة دي مصدر واحد للتنقل بيتفلتر
// حسب صلاحيات المستخدم فعليًا (مش hardcoded حسب الدور).
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    labelAr: "لوحة التحكم",
    icon: "LayoutDashboard",
    permission: PERMISSIONS.DASHBOARD_VIEW_ALL,
  },
  {
    href: "/equipment",
    labelAr: "المخزون والمعدات",
    icon: "Package",
    permission: PERMISSIONS.INVENTORY_READ,
  },
  {
    href: "/maintenance",
    labelAr: "الصيانة",
    icon: "Wrench",
    permission: PERMISSIONS.MAINTENANCE_READ,
  },
  {
    href: "/hr",
    labelAr: "الموارد البشرية",
    icon: "Users",
    permission: PERMISSIONS.HR_READ,
  },
  {
    href: "/accounting",
    labelAr: "المحاسبة والفوترة",
    icon: "Receipt",
    permission: PERMISSIONS.ACCOUNTING_READ,
  },
  {
    href: "/accounting/quotes",
    labelAr: "عروض الأسعار",
    icon: "FileSpreadsheet",
    permission: PERMISSIONS.QUOTE_READ,
  },
  {
    href: "/rentals",
    labelAr: "الإيجارات والعملاء",
    icon: "Handshake",
    permission: PERMISSIONS.RENTALS_READ,
  },
  {
    href: "/support",
    labelAr: "الدعم الفني",
    icon: "LifeBuoy",
    permission: PERMISSIONS.SUPPORT_READ,
  },
  {
    href: "/notifications",
    labelAr: "التنبيهات",
    icon: "Bell",
    permission: PERMISSIONS.ALERTS_READ,
  },
  {
    href: "/users",
    labelAr: "المستخدمين والصلاحيات",
    icon: "ShieldCheck",
    permission: PERMISSIONS.USERS_MANAGE,
  },
  {
    href: "/expenses",
    labelAr: "المصروفات",
    icon: "Wallet",
    permission: PERMISSIONS.EXPENSES_READ,
  },
  {
    href: "/settings",
    labelAr: "إعدادات الشركة",
    icon: "Settings",
    permission: PERMISSIONS.SETTINGS_READ,
  },
];
