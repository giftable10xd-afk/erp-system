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
import { Plus, Wallet } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS, monthNameAr } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { MonthArchiveStrip } from "@/components/month-archive-strip";
import { StatPill } from "@/components/stat-pill";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.EXPENSES_READ);
  const canWrite = session.permissions.has(PERMISSIONS.EXPENSES_WRITE);

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();
  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd = new Date(periodYear, periodMonth, 1);

  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: periodStart, lt: periodEnd } },
    orderBy: { expenseDate: "desc" },
    include: { recordedBy: true },
    take: 200,
  });

  const totalByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Wallet}
        title="المصروفات"
        description="مصروفات التشغيل — وقود، قطع غيار، مرتبات، مرافق"
        color="amber"
        actions={
          canWrite && (
            <Button
              nativeButton={false}
              render={
                <Link href="/expenses/new">
                  <Plus className="size-4" />
                  تسجيل مصروف
                </Link>
              }
            />
          )
        }
      />

      <MonthArchiveStrip basePath="/expenses" periodMonth={periodMonth} periodYear={periodYear} />

      <div className="flex flex-wrap gap-3">
        <StatPill label={`إجمالي ${monthNameAr(periodMonth)}`} value={formatCurrency(totalExpenses.toFixed(0))} />
        {Object.entries(totalByCategory).map(([category, amount]) => (
          <StatPill
            key={category}
            label={EXPENSE_CATEGORY_LABELS[category] ?? category}
            value={formatCurrency(amount.toFixed(0))}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>سجّله</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  مفيش مصروفات مسجلة في {monthNameAr(periodMonth)} {periodYear}
                </TableCell>
              </TableRow>
            )}
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{formatDate(e.expenseDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}</Badge>
                </TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell>{formatCurrency(e.amount.toString())}</TableCell>
                <TableCell>{e.recordedBy.fullNameAr}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
