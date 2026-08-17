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
import { Plus, Receipt } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS, monthNameAr } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { MonthArchiveStrip } from "@/components/month-archive-strip";
import { StatPill } from "@/components/stat-pill";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const canWrite = session.permissions.has(PERMISSIONS.ACCOUNTING_WRITE);

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();
  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd = new Date(periodYear, periodMonth, 1);

  const invoices = await prisma.invoice.findMany({
    where: { issueDate: { gte: periodStart, lt: periodEnd } },
    orderBy: { issueDate: "desc" },
    include: { customer: true, payments: true },
    take: 200,
  });

  const totalIssued = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalCollected = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Receipt}
        title="المحاسبة والفوترة"
        description="فواتير رسمية مرتبطة بالعملاء والعقود"
        color="green"
        actions={
          canWrite && (
            <Button
              nativeButton={false}
              render={
                <Link href="/accounting/new">
                  <Plus className="size-4" />
                  فاتورة جديدة
                </Link>
              }
            />
          )
        }
      />

      <MonthArchiveStrip basePath="/accounting" periodMonth={periodMonth} periodYear={periodYear} />

      <div className="flex flex-wrap gap-3">
        <StatPill label={`عدد فواتير ${monthNameAr(periodMonth)}`} value={invoices.length} />
        <StatPill label="إجمالي الصادر" value={formatCurrency(totalIssued.toFixed(0))} />
        <StatPill label="إجمالي المحصّل" value={formatCurrency(totalCollected.toFixed(0))} />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead>المدفوع</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  مفيش فواتير مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/accounting/${inv.id}`} className="text-primary hover:underline">
                      <span className="ltr-technical">{inv.invoiceNumber}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{inv.customer.nameAr}</TableCell>
                  <TableCell>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell>{formatCurrency(inv.total.toString())}</TableCell>
                  <TableCell>{formatCurrency(paid.toString())}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={INVOICE_STATUS_CLASSES[inv.status]}>
                      {INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
