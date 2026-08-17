import Link from "next/link";
import { Button } from "@/components/ui/button";
import { monthNameAr } from "@/lib/labels";

// شريط تنقل شهري قابل لإعادة الاستخدام — نفس النمط المستخدم أصلًا في
// hr/payroll/page.tsx، مُستخرج هنا عشان باقي الموديولات (المحاسبة، عروض
// الأسعار، الصيانة، الإيجارات) تستخدمه من غير تكرار.
export function MonthArchiveStrip({
  basePath,
  periodMonth,
  periodYear,
  monthsBack = 12,
}: {
  basePath: string;
  periodMonth: number;
  periodYear: number;
  monthsBack?: number;
}) {
  const now = new Date();
  const archiveMonths = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  return (
    <div className="flex flex-wrap gap-2">
      {archiveMonths.map((m) => (
        <Button
          key={`${m.year}-${m.month}`}
          variant={m.month === periodMonth && m.year === periodYear ? "default" : "outline"}
          size="sm"
          nativeButton={false}
          render={<Link href={`${basePath}?month=${m.month}&year=${m.year}`} />}
        >
          {monthNameAr(m.month)} {m.year}
        </Button>
      ))}
    </div>
  );
}
