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
import { Handshake, Plus } from "lucide-react";
import { formatDate } from "@/lib/format";
import { RENTAL_STATUS_CLASSES, RENTAL_STATUS_LABELS, monthNameAr } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { MonthArchiveStrip } from "@/components/month-archive-strip";
import { StatPill } from "@/components/stat-pill";

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.RENTALS_READ);
  const canWrite = session.permissions.has(PERMISSIONS.RENTALS_WRITE);

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();
  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd = new Date(periodYear, periodMonth, 1);

  const contracts = await prisma.rentalContract.findMany({
    where: { startDate: { gte: periodStart, lt: periodEnd } },
    orderBy: { startDate: "desc" },
    include: { customer: true, equipment: true },
    take: 200,
  });

  const countByStatus = contracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Handshake}
        title="الإيجارات والعملاء"
        description="عقود إيجار المعدات ومواعيد الاستلام والتسليم"
        color="pink"
        actions={
          canWrite && (
            <>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/rentals/customers">العملاء</Link>}
              />
              <Button
                nativeButton={false}
                render={
                  <Link href="/rentals/new">
                    <Plus className="size-4" />
                    عقد إيجار جديد
                  </Link>
                }
              />
            </>
          )
        }
      />

      <MonthArchiveStrip basePath="/rentals" periodMonth={periodMonth} periodYear={periodYear} />

      <div className="flex flex-wrap gap-3">
        <StatPill label={`إجمالي ${monthNameAr(periodMonth)}`} value={contracts.length} />
        {Object.entries(countByStatus).map(([status, count]) => (
          <StatPill key={status} label={RENTAL_STATUS_LABELS[status] ?? status} value={count} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم العقد</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>المعدة</TableHead>
              <TableHead>تاريخ البداية</TableHead>
              <TableHead>الاستحقاق</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  مفيش عقود إيجار مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/rentals/${c.id}`} className="text-primary hover:underline">
                    <span className="ltr-technical">{c.contractNumber}</span>
                  </Link>
                </TableCell>
                <TableCell>{c.customer.nameAr}</TableCell>
                <TableCell>
                  <span className="ltr-technical">{c.equipment.assetTag}</span>
                </TableCell>
                <TableCell>{formatDate(c.startDate)}</TableCell>
                <TableCell>{formatDate(c.expectedReturnDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={RENTAL_STATUS_CLASSES[c.status]}>
                    {RENTAL_STATUS_LABELS[c.status] ?? c.status}
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
