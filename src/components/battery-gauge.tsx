"use client";

import { motion } from "motion/react";
import { formatNumber } from "@/lib/format";

/**
 * مؤشر بطارية متحرك — بيمثّل مخزون صنف (زي بطاريات ١٢ فولت) كنسبة من
 * "امتلاء" افتراضي بيساوي ضعف حد إعادة الطلب (يعني عند حد إعادة الطلب
 * بالظبط المؤشر بيبان نصه، زي أي بطارية حقيقية بتقول "قرّب وقت الشحن").
 * تحت حد إعادة الطلب = حالة نقص (أحمر + نبضة تنبيه).
 */
export function BatteryGauge({
  label,
  quantity,
  reorderLevel,
  unit = "قطعة",
}: {
  label: string;
  quantity: number;
  reorderLevel: number;
  unit?: string;
}) {
  const target = Math.max(reorderLevel * 2, 1);
  const percent = Math.max(0, Math.min(1, quantity / target));
  const shortage = quantity <= reorderLevel;

  const fillColor = shortage
    ? "var(--destructive)"
    : percent < 0.5
      ? "var(--status-maintenance)"
      : "var(--status-active)";

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="font-ltr-display text-lg font-bold text-foreground">
          {formatNumber(quantity)} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
        <motion.div
          animate={shortage ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
          transition={shortage ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
          className="relative h-8 w-16 rounded-md border-2 border-border p-0.5"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-sm"
            style={{ backgroundColor: fillColor }}
          />
        </motion.div>
        <span className="h-3 w-1 rounded-e-sm bg-border" />
      </div>
    </div>
  );
}
