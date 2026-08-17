"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { count: number };
        setCount(data.count);
      } catch {
        // تجاهل رسالة مش صالحة
      }
    };
    return () => source.close();
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
      aria-label="التنبيهات"
    >
      <motion.span
        animate={count > 0 ? { rotate: [0, -12, 10, -6, 0] } : {}}
        transition={{ duration: 0.6, repeat: count > 0 ? Infinity : 0, repeatDelay: 3 }}
      >
        <Bell className="size-4" />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="absolute -top-1 -end-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
