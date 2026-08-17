"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, animate } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { Wrench, Package, Receipt, Handshake, LifeBuoy, Users, Bell, FileSpreadsheet, Wallet } from "lucide-react";

// نفس نمط sidebar-nav.tsx: مينفعش تعدي كومبوننت أيقونة كـ prop من Server
// Component لـ Client Component (StatCard محتاج يبقى client عشان الحركة) —
// فبنعدي اسم الأيقونة بس وبنحلّه هنا جوه الكومبوننت نفسه.
const STAT_ICONS = {
  Wrench,
  Package,
  Receipt,
  Handshake,
  LifeBuoy,
  Users,
  Bell,
  FileSpreadsheet,
  Wallet,
} as const;
export type StatIconName = keyof typeof STAT_ICONS;

const STAT_COLORS = {
  blue: { bg: "bg-badge-1-bg", icon: "text-badge-1" },
  amber: { bg: "bg-badge-2-bg", icon: "text-badge-2" },
  green: { bg: "bg-badge-3-bg", icon: "text-badge-3" },
  violet: { bg: "bg-badge-4-bg", icon: "text-badge-4" },
  pink: { bg: "bg-badge-5-bg", icon: "text-badge-5" },
  cyan: { bg: "bg-badge-6-bg", icon: "text-badge-6" },
} as const;

export function StatCard({
  icon,
  label,
  value,
  numericValue,
  href,
  color,
  attention = false,
  index = 0,
}: {
  icon: StatIconName;
  label: string;
  /** القيمة الجاهزة للعرض (نص عادي أو مركّب زي "١ / ٥") */
  value: string;
  /** لو موجودة، الرقم بيتحرك من صفر للقيمة دي بدل ما يتعرض ثابت */
  numericValue?: number;
  href: string;
  color: keyof typeof STAT_COLORS;
  /** المؤشر ده محتاج انتباه فعلي دلوقتي — بياخد شريط التحذير الأصفر */
  attention?: boolean;
  index?: number;
}) {
  const Icon = STAT_ICONS[icon];
  const classes = STAT_COLORS[color];
  const [displayValue, setDisplayValue] = useState(numericValue !== undefined ? "٠" : value);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (numericValue === undefined) return;
    const controls = animate(0, numericValue, {
      duration: 0.6,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayValue(formatNumber(Math.round(v))),
    });
    return () => controls.stop();
  }, [numericValue, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={href}>
        <Card className="relative overflow-hidden py-0 ring-1 ring-border transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6)]">
          {attention && <span className="absolute inset-x-0 top-0 h-1 stripe-attention" />}
          <CardContent className="flex items-start justify-between gap-3 px-4 py-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug text-balance text-muted-foreground">{label}</p>
              <p ref={ref} className="font-ltr-display text-2xl font-bold tracking-wide text-foreground">
                {displayValue}
              </p>
            </div>
            <motion.span
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.12 }}
              className={`flex size-11 shrink-0 items-center justify-center rounded-md ${classes.bg}`}
            >
              <Icon className={`size-5 ${classes.icon}`} />
            </motion.span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
