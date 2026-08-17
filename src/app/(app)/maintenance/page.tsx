import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Wrench } from "lucide-react";
import { formatDate } from "@/lib/format";
import { JOB_TYPE_LABELS, monthNameAr } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { MonthArchiveStrip } from "@/components/month-archive-strip";
import { StatPill } from "@/components/stat-pill";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.MAINTENANCE_READ);
  const canCreate = session.permissions.has(PERMISSIONS.MAINTENANCE_CREATE);

  // المهندس بيشوف شغله بس (فلترة بيانات مش صلاحية منفصلة) — المالك والأدوار
  // اللي عندها maintenance:read العامة بتشوف الكل.
  const isEngineerOnly =
    session.roleKeys.includes("engineer") && !session.roleKeys.includes("owner");

  const params = await searchParams;
  const now = new Date();
  const periodMonth = Number(params.month) || now.getMonth() + 1;
  const periodYear = Number(params.year) || now.getFullYear();
  const periodStart = new Date(periodYear, periodMonth - 1, 1);
  const periodEnd = new Date(periodYear, periodMonth, 1);

  const jobs = await prisma.maintenanceJob.findMany({
    where: {
      isActive: true,
      startedAt: { gte: periodStart, lt: periodEnd },
      ...(isEngineerOnly ? { engineerUserId: session.id } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: { equipment: true, engineer: true, items: true },
    take: 200,
  });

  const countByType = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.jobType] = (acc[j.jobType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Wrench}
        title="الصيانة"
        description="كل عملية صيانة مربوطة بالمهندس والمعدة، وأي مواد اتستهلكت بتتخصم أوتوماتيك من المخزون"
        color="amber"
        actions={
          canCreate && (
            <Button
              nativeButton={false}
              render={
                <Link href="/maintenance/new">
                  <Plus className="size-4" />
                  تسجيل صيانة
                </Link>
              }
            />
          )
        }
      />

      <MonthArchiveStrip basePath="/maintenance" periodMonth={periodMonth} periodYear={periodYear} />

      <div className="flex flex-wrap gap-3">
        <StatPill label={`إجمالي ${monthNameAr(periodMonth)}`} value={jobs.length} />
        {Object.entries(countByType).map(([type, count]) => (
          <StatPill key={type} label={JOB_TYPE_LABELS[type] ?? type} value={count} />
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المعدة</TableHead>
              <TableHead>المهندس</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>عدد القطع المستهلكة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  مفيش عمليات صيانة مسجلة في {monthNameAr(periodMonth)} {periodYear}
                </TableCell>
              </TableRow>
            )}
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <Link href={`/maintenance/${job.id}`} className="text-primary hover:underline">
                    {formatDate(job.startedAt)}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="ltr-technical">{job.equipment.assetTag}</span>
                </TableCell>
                <TableCell>{job.engineer.fullNameAr}</TableCell>
                <TableCell>{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</TableCell>
                <TableCell>{job.items.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
