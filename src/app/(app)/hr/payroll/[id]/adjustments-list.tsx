"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

type AdjustmentRow = {
  id: string;
  type: string;
  reason: string;
  amount: string;
  createdByName: string;
  createdAtLabel: string;
};

export function AdjustmentsList({ items }: { items: AdjustmentRow[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
        >
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                item.type === "addition"
                  ? "bg-status-active-bg text-status-active"
                  : "bg-destructive/10 text-destructive"
              }
            >
              {item.type === "addition" ? "إضافة" : "خصم"}
            </Badge>
            <span>{item.reason}</span>
          </div>
          <div className="text-end">
            <p className="ltr-technical font-medium">{item.amount}</p>
            <p className="text-xs text-muted-foreground">
              {item.createdByName} — {item.createdAtLabel}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
