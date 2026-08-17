import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { PAYROLL_STATUS_LABELS, monthNameAr } from "@/lib/labels";
import { generateMonthlyPayrollAction } from "@/lib/actions/hr-actions";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.HR_READ);
  const canWrite = session.permissions.has(PERMISSIONS.HR_WRITE);

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();

  const records = await prisma.payrollRecord.findMany({
    where: { periodMonth, periodYear },
    include: { employee: true },
    orderBy: { employee: { fullNameAr: "asc" } },
  });

  // أرشيف مختصر: آخر 12 شهر متاحة للتنقل السريع
  const archiveMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            المرتبات — {monthNameAr(periodMonth)} {periodYear}
          </h1>
          <p className="text-sm text-muted-foreground">أرشيف شهري قابل للرجوع إليه بسهولة</p>
        </div>
        {canWrite && (
          <form action={generateMonthlyPayrollAction}>
            <input type="hidden" name="periodMonth" value={periodMonth} />
            <input type="hidden" name="periodYear" value={periodYear} />
            <Button type="submit">إنشاء سجلات الشهر</Button>
          </form>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {archiveMonths.map((m) => (
          <Button
            key={`${m.year}-${m.month}`}
            variant={m.month === periodMonth && m.year === periodYear ? "default" : "outline"}
            size="sm"
            nativeButton={false}
            render={<Link href={`/hr/payroll?month=${m.month}&year=${m.year}`} />}
          >
            {monthNameAr(m.month)} {m.year}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الموظف</TableHead>
              <TableHead>المرتب الأساسي</TableHead>
              <TableHead>الخصومات</TableHead>
              <TableHead>الصافي</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  مفيش سجلات مرتبات للشهر ده لسه
                </TableCell>
              </TableRow>
            )}
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/hr/payroll/${r.id}`} className="text-primary hover:underline">
                    {r.employee.fullNameAr}
                  </Link>
                </TableCell>
                <TableCell>{formatCurrency(r.baseSalary.toString())}</TableCell>
                <TableCell>{formatCurrency(r.deductionsTotal.toString())}</TableCell>
                <TableCell>{formatCurrency(r.netPay.toString())}</TableCell>
                <TableCell>
                  <Badge variant="outline">{PAYROLL_STATUS_LABELS[r.status] ?? r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
