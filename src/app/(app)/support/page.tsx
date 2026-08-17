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
import { LifeBuoy, Plus } from "lucide-react";
import { formatDate } from "@/lib/format";
import {
  TICKET_PRIORITY_CLASSES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_CLASSES,
  TICKET_STATUS_LABELS,
} from "@/lib/labels";
import { PageHeader } from "@/components/page-header";

export default async function SupportPage() {
  const session = await requirePermission(PERMISSIONS.SUPPORT_READ);
  const canWrite = session.permissions.has(PERMISSIONS.SUPPORT_WRITE);

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, equipment: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LifeBuoy}
        title="الدعم الفني"
        description="متابعة طلبات الدعم من البداية للحل"
        color="amber"
        actions={
          canWrite && (
            <Button
              nativeButton={false}
              render={
                <Link href="/support/new">
                  <Plus className="size-4" />
                  طلب دعم جديد
                </Link>
              }
            />
          )
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم</TableHead>
              <TableHead>الموضوع</TableHead>
              <TableHead>العميل/المعدة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  مفيش طلبات دعم مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link href={`/support/${t.id}`} className="text-primary hover:underline">
                    <span className="ltr-technical">{t.ticketNumber}</span>
                  </Link>
                </TableCell>
                <TableCell>{t.subject}</TableCell>
                <TableCell>
                  {t.customer?.nameAr}
                  {t.customer && t.equipment && " — "}
                  {t.equipment && <span className="ltr-technical">{t.equipment.assetTag}</span>}
                  {!t.customer && !t.equipment && "—"}
                </TableCell>
                <TableCell>{formatDate(t.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={TICKET_PRIORITY_CLASSES[t.priority]}>
                    {TICKET_PRIORITY_LABELS[t.priority] ?? t.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={TICKET_STATUS_CLASSES[t.status]}>
                    {TICKET_STATUS_LABELS[t.status] ?? t.status}
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
