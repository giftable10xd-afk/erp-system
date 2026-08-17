import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatDate, formatNumber } from "@/lib/format";
import {
  COMPONENT_TYPE_LABELS,
  JOB_TYPE_LABELS,
  COMPONENT_EVENT_TYPE_LABELS,
} from "@/lib/labels";
import { archiveMaintenanceJobAction } from "@/lib/actions/maintenance-actions";

export default async function MaintenanceJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.MAINTENANCE_READ);
  const canWrite = session.permissions.has(PERMISSIONS.MAINTENANCE_CREATE);
  const { id } = await params;

  const job = await prisma.maintenanceJob.findUnique({
    where: { id },
    include: {
      equipment: true,
      engineer: true,
      items: { include: { inventoryItem: true } },
      serviceEvents: { include: { equipmentComponent: true } },
    },
  });

  if (!job) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">صيانة {formatDate(job.startedAt)}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/equipment/${job.equipment.id}`} className="text-primary hover:underline">
              <span className="ltr-technical">{job.equipment.assetTag}</span>
            </Link>
            {" — "}
            {JOB_TYPE_LABELS[job.jobType] ?? job.jobType} — بواسطة {job.engineer.fullNameAr}
          </p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/maintenance/${job.id}/edit`}>تعديل</Link>}
            />
            <form action={archiveMaintenanceJobAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <ConfirmSubmitButton
                variant="destructive"
                size="sm"
                confirmMessage="أرشفة عملية الصيانة دي؟ هتختفي من القوائم بس تفاصيلها هتفضل محفوظة."
              >
                أرشفة
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </div>

      {job.description && (
        <Card>
          <CardHeader>
            <CardTitle>وصف العملية</CardTitle>
          </CardHeader>
          <CardContent>{job.description}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>القطع/المواد المستهلكة</CardTitle>
        </CardHeader>
        <CardContent>
          {job.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش قطع اتستهلكت في العملية دي</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {job.items.map((item) => (
                <li key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{item.inventoryItem.nameAr}</span>
                  <span>
                    {formatNumber(item.quantity.toString())} {item.inventoryItem.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>القطع اللي اتصانت</CardTitle>
        </CardHeader>
        <CardContent>
          {job.serviceEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش قطع اتسجلت صيانتها في العملية دي</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {job.serviceEvents.map((event) => (
                <li key={event.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>
                    {event.equipmentComponent.name} (
                    {COMPONENT_TYPE_LABELS[event.equipmentComponent.componentType] ??
                      event.equipmentComponent.componentType}
                    )
                  </span>
                  <span>{COMPONENT_EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
