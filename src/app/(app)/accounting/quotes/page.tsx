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
import { Plus, FileSpreadsheet } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { QUOTE_STATUS_CLASSES, QUOTE_STATUS_LABELS, monthNameAr } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { MonthArchiveStrip } from "@/components/month-archive-strip";
import { StatPill } from "@/components/stat-pill";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.QUOTE_READ);
  const canWrite = session.permissions.has(PERMISSIONS.QUOTE_WRITE);

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();
  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd = new Date(periodYear, periodMonth, 1);

  const quotes = await prisma.quote.findMany({
    where: { issueDate: { gte: periodStart, lt: periodEnd } },
    orderBy: { issueDate: "desc" },
    include: { customer: true },
    take: 200,
  });

  const countByStatus = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={FileSpreadsheet}
        title="عروض الأسعار"
        description="عروض أسعار للعملاء — تتحول لفاتورة بعد الموافقة"
        color="cyan"
        actions={
          canWrite && (
            <Button
              nativeButton={false}
              render={
                <Link href="/accounting/quotes/new">
                  <Plus className="size-4" />
                  عرض سعر جديد
                </Link>
              }
            />
          )
        }
      />

      <MonthArchiveStrip basePath="/accounting/quotes" periodMonth={periodMonth} periodYear={periodYear} />

      <div className="flex flex-wrap gap-3">
        <StatPill label={`إجمالي ${monthNameAr(periodMonth)}`} value={quotes.length} />
        {Object.entries(countByStatus).map(([status, count]) => (
          <StatPill key={status} label={QUOTE_STATUS_LABELS[status] ?? status} value={count} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العرض</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  مفيش عروض أسعار مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <Link href={`/accounting/quotes/${q.id}`} className="text-primary hover:underline">
                    <span className="ltr-technical">{q.quoteNumber}</span>
                  </Link>
                </TableCell>
                <TableCell>{q.customer.nameAr}</TableCell>
                <TableCell>{formatDate(q.issueDate)}</TableCell>
                <TableCell>{formatNumber(q.total.toString())}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={QUOTE_STATUS_CLASSES[q.status]}>
                    {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
