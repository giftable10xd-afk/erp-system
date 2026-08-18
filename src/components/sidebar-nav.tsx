"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  Receipt,
  FileSpreadsheet,
  LifeBuoy,
  Handshake,
  Bell,
  ShieldCheck,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavItem, NavIconName } from "@/lib/nav-items";

const ICONS: Record<NavIconName, LucideIcon> = {
  LayoutDashboard,
  Package,
  Wrench,
  Users,
  Receipt,
  FileSpreadsheet,
  LifeBuoy,
  Handshake,
  Bell,
  ShieldCheck,
  Settings,
  Wallet,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            // كل عناصر السايدبار ظاهرة في نفس الوقت، والـprefetch الافتراضي
            // بيطلب بيانات RSC لكل رابط فيهم مرة واحدة أول ما الصفحة تفتح —
            // يعني ١٢ رندر كامل على السيرفر (كل واحد بياخد اتصال قاعدة بيانات)
            // بدل واحد. ده كان بيرجّع 503 على /maintenance و/accounting.
            // prefetch={false} بيوقف ده، وNext لسه بيعمل prefetch عند hover،
            // فالتنقل بيفضل سريع من غير الضغط الابتدائي.
            prefetch={false}
            className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active-indicator"
                className="absolute inset-y-1 end-0 w-0.5 rounded-full bg-sidebar-primary shadow-[0_0_6px_var(--sidebar-primary)]"
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
            <Icon className={`relative z-10 size-4 shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
            <span className="relative z-10 text-right font-heading">{item.labelAr}</span>
          </Link>
        );
      })}
    </nav>
  );
}
