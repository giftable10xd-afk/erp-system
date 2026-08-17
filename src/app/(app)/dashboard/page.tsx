import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import {
  MOVEMENT_TYPE_LABELS,
  RENTAL_STATUS_CLASSES,
  RENTAL_STATUS_LABELS,
  TICKET_PRIORITY_CLASSES,
  TICKET_PRIORITY_LABELS,
} from "@/lib/labels";
import { Wrench, Package, Receipt, Handshake, LifeBuoy, Users, Bell, LayoutDashboard } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { BatteryGauge } from "@/components/battery-gauge";

export default async function DashboardPage() {
  const session = await requirePermission(PERMISSIONS.DASHBOARD_VIEW_ALL);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    recentMaintenance,
    recentMovements,
    unpaidInvoices,
    activeRentals,
    overdueRentals,
    openTickets,
    todayAttendanceCount,
    activeEmployeeCount,
    unreadAlertsCount,
    lowStockItems,
    paidThisMonthAgg,
    pendingQuotesCount,
    acceptedQuotesCount,
    topCustomerTotals,
  ] = await Promise.all([
    prisma.maintenanceJob.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      orderBy: { startedAt: "desc" },
      take: 6,
      include: { equipment: true, engineer: true },
    }),
    prisma.stockMovement.findMany({
      where: { occurredAt: { gte: sevenDaysAgo } },
      orderBy: { occurredAt: "desc" },
      take: 6,
      include: { inventoryItem: true, performedBy: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["issued", "draft"] } },
      include: { payments: true },
    }),
    prisma.rentalContract.count({ where: { status: "active" } }),
    prisma.rentalContract.count({
      where: { status: "active", expectedReturnDate: { lt: new Date() } },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
    prisma.attendanceRecord.count({ where: { date: today, status: "present" } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.notification.count({ where: { recipientUserId: session.id, isRead: false } }),
    prisma.inventoryItem.findMany(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: firstOfMonth } },
    }),
    prisma.quote.count({ where: { status: "sent" } }),
    prisma.quote.count({ where: { status: "accepted" } }),
    prisma.invoice.groupBy({
      by: ["customerId"],
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(inv.total) - paid);
  }, 0);

  const lowStockCount = lowStockItems.filter(
    (i) => Number(i.currentQuantity) <= Number(i.reorderLevel)
  ).length;

  const batteryItem = lowStockItems.find((i) => i.sku === "BATTERY-12V");

  const paidThisMonth = Number(paidThisMonthAgg._sum.amount ?? 0);

  const topCustomers = await Promise.all(
    topCustomerTotals.map(async (row) => {
      const customer = await prisma.customer.findUniqueOrThrow({ where: { id: row.customerId } });
      return { customer, total: Number(row._sum.total ?? 0) };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 items-center gap-4 rounded-md bg-card p-6 ring-1 ring-border">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <LayoutDashboard className="size-7 text-primary" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-heading-foreground">مرحبًا، {session.fullNameAr}</h1>
            <p className="text-muted-foreground">
              ملخص شامل لكل الأقسام — الورشة، المخزن، المحاسبة، والإيجارات
            </p>
          </div>
        </div>
        {batteryItem && (
          <Card className="relative overflow-hidden lg:w-72">
            {Number(batteryItem.currentQuantity) <= Number(batteryItem.reorderLevel) && (
              <span className="absolute inset-x-0 top-0 h-1 stripe-attention" />
            )}
            <CardContent className="flex h-full items-center py-6">
              <BatteryGauge
                label={batteryItem.nameAr}
                quantity={Number(batteryItem.currentQuantity)}
                reorderLevel={Number(batteryItem.reorderLevel)}
                unit={batteryItem.unit}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          icon="Wrench"
          label="صيانة آخر ٧ أيام"
          value={formatNumber(recentMaintenance.length)}
          numericValue={recentMaintenance.length}
          href="/maintenance"
          color="amber"
        />
        <StatCard
          index={1}
          icon="Package"
          label="أصناف تحت الحد الأدنى"
          value={formatNumber(lowStockCount)}
          numericValue={lowStockCount}
          href="/equipment/inventory"
          color="cyan"
          attention={lowStockCount > 0}
        />
        <StatCard
          index={2}
          icon="Receipt"
          label="مستحقات غير محصلة"
          value={formatNumber(unpaidTotal.toFixed(0))}
          numericValue={Math.round(unpaidTotal)}
          href="/accounting"
          color="green"
        />
        <StatCard
          index={3}
          icon="Handshake"
          label="عقود إيجار قائمة"
          value={formatNumber(activeRentals)}
          numericValue={activeRentals}
          href="/rentals"
          color="pink"
        />
        <StatCard
          index={4}
          icon="LifeBuoy"
          label="طلبات دعم مفتوحة"
          value={formatNumber(openTickets.length)}
          numericValue={openTickets.length}
          href="/support"
          color="amber"
        />
        <StatCard
          index={5}
          icon="Users"
          label="حضور اليوم"
          value={`${formatNumber(todayAttendanceCount)} / ${formatNumber(activeEmployeeCount)}`}
          href="/hr/attendance"
          color="violet"
        />
        <StatCard
          index={6}
          icon="Bell"
          label="تنبيهات غير مقروءة"
          value={formatNumber(unreadAlertsCount)}
          numericValue={unreadAlertsCount}
          href="/notifications"
          color="pink"
          attention={unreadAlertsCount > 0}
        />
        <StatCard
          index={7}
          icon="Handshake"
          label="عقود متأخرة عن التسليم"
          value={formatNumber(overdueRentals)}
          numericValue={overdueRentals}
          href="/rentals"
          color="blue"
          attention={overdueRentals > 0}
        />
        <StatCard
          index={8}
          icon="Wallet"
          label="محصّل الشهر الحالي"
          value={formatNumber(paidThisMonth.toFixed(0))}
          numericValue={Math.round(paidThisMonth)}
          href="/accounting"
          color="green"
        />
        <StatCard
          index={9}
          icon="FileSpreadsheet"
          label="عروض أسعار قيد الانتظار"
          value={`${formatNumber(pendingQuotesCount)} / ${formatNumber(acceptedQuotesCount)} متقبَّل`}
          href="/accounting/quotes"
          color="cyan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-badge-2-bg">
                <Wrench className="size-3.5 text-badge-2" />
              </span>
              آخر عمليات الورشة
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentMaintenance.length === 0 && (
              <p className="text-sm text-muted-foreground">مفيش عمليات صيانة الفترة دي</p>
            )}
            {recentMaintenance.map((job) => (
              <Link
                key={job.id}
                href={`/maintenance/${job.id}`}
                className="flex justify-between border-b border-border pb-2 text-sm last:border-0 hover:text-primary"
              >
                <span>
                  <span className="ltr-technical-display">{job.equipment.assetTag}</span> —{" "}
                  {job.engineer.fullNameAr}
                </span>
                <span className="text-muted-foreground">{formatDate(job.startedAt)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-badge-6-bg">
                <Package className="size-3.5 text-badge-6" />
              </span>
              آخر حركات المخزن
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentMovements.length === 0 && (
              <p className="text-sm text-muted-foreground">مفيش حركات مخزون الفترة دي</p>
            )}
            {recentMovements.map((m) => (
              <div key={m.id} className="flex justify-between border-b border-border pb-2 text-sm last:border-0">
                <span>
                  {m.inventoryItem.nameAr} — {MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}
                </span>
                <span className="text-muted-foreground">{formatDateTime(m.occurredAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-badge-5-bg">
                <LifeBuoy className="size-3.5 text-badge-5" />
              </span>
              طلبات الدعم المفتوحة
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {openTickets.length === 0 && (
              <p className="text-sm text-muted-foreground">مفيش طلبات دعم مفتوحة</p>
            )}
            {openTickets.map((t) => (
              <Link
                key={t.id}
                href={`/support/${t.id}`}
                className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 hover:text-primary"
              >
                <span>{t.subject}</span>
                <Badge variant="outline" className={TICKET_PRIORITY_CLASSES[t.priority]}>
                  {TICKET_PRIORITY_LABELS[t.priority]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {topCustomers.length > 0 && (
        <Card className="ring-1 ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-badge-3-bg">
                <Receipt className="size-3.5 text-badge-3" />
              </span>
              أكبر العملاء (إجمالي الفواتير)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topCustomers.map(({ customer, total }) => (
              <div
                key={customer.id}
                className="flex justify-between border-b border-border pb-2 text-sm last:border-0"
              >
                <span>{customer.nameAr}</span>
                <span className="ltr-technical font-medium">{formatNumber(total.toFixed(0))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {overdueRentals > 0 && (
        <Card className="relative overflow-hidden ring-1 ring-border">
          <span className="absolute inset-x-0 top-0 h-1 stripe-attention" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-heading-foreground">
              عقود إيجار متأخرة
              <Badge variant="destructive">{formatNumber(overdueRentals)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OverdueRentalsList />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function OverdueRentalsList() {
  const contracts = await prisma.rentalContract.findMany({
    where: { status: "active", expectedReturnDate: { lt: new Date() } },
    include: { customer: true, equipment: true },
  });

  return (
    <div className="flex flex-col gap-2">
      {contracts.map((c) => (
        <Link
          key={c.id}
          href={`/rentals/${c.id}`}
          className="flex justify-between border-b pb-2 text-sm last:border-0 hover:text-primary"
        >
          <span>
            {c.customer.nameAr} — <span className="ltr-technical">{c.equipment.assetTag}</span>
          </span>
          <Badge variant="outline" className={RENTAL_STATUS_CLASSES.overdue}>
            {RENTAL_STATUS_LABELS.overdue} منذ {formatDate(c.expectedReturnDate)}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
