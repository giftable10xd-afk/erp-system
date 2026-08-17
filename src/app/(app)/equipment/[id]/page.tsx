import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_ACTION_LABELS,
  COMPONENT_TYPE_LABELS,
  EQUIPMENT_FIELD_LABELS,
  EQUIPMENT_STATUS_CLASSES,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";
import { AddComponentForm } from "./add-component-form";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { JOB_TYPE_LABELS } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { archiveEquipmentComponentAction } from "@/lib/actions/inventory-actions";

export default async function EquipmentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.INVENTORY_READ);
  const { id } = await params;

  const [equipment, auditEntries, stockMovements] = await Promise.all([
    prisma.equipment.findUnique({
      where: { id },
      include: {
        components: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
        maintenanceJobs: {
          orderBy: { startedAt: "desc" },
          include: {
            engineer: true,
            items: { include: { inventoryItem: true } },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "Equipment", entityId: id },
      include: { actor: true },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.stockMovement.findMany({
      where: { destinationEquipmentId: id },
      include: { inventoryItem: true, performedBy: true },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  if (!equipment) notFound();

  const canWrite = session.permissions.has(PERMISSIONS.INVENTORY_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ltr-technical">{equipment.assetTag}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {equipment.brand}
            {equipment.brand && equipment.model && " / "}
            {equipment.model && <span className="ltr-technical">{equipment.model}</span>}
            {!equipment.brand && !equipment.model && (EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={EQUIPMENT_STATUS_CLASSES[equipment.status]}>
            {EQUIPMENT_STATUS_LABELS[equipment.status] ?? equipment.status}
          </Badge>
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/equipment/${equipment.id}/edit`}>
                  <Pencil className="size-3.5" />
                  تعديل
                </Link>
              }
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">النوع</CardTitle>
          </CardHeader>
          <CardContent>{EQUIPMENT_TYPE_LABELS[equipment.type] ?? equipment.type}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">الرقم المسلسل</CardTitle>
          </CardHeader>
          <CardContent className="ltr-technical">{equipment.serialNumber || "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ملاحظات</CardTitle>
          </CardHeader>
          <CardContent>{equipment.notes || "—"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الفلاتر والزيوت والبخاخات وقطع الغيار</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>آخر صيانة</TableHead>
                  <TableHead>الاستحقاق القادم</TableHead>
                  {canWrite && <TableHead>إجراء</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.components.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 5 : 4} className="text-center text-muted-foreground">
                      مفيش قطع مسجلة لسه
                    </TableCell>
                  </TableRow>
                )}
                {equipment.components.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{COMPONENT_TYPE_LABELS[c.componentType] ?? c.componentType}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{formatDate(c.lastServiceAt)}</TableCell>
                    <TableCell>{formatDate(c.nextDueAt)}</TableCell>
                    {canWrite && (
                      <TableCell>
                        <form action={archiveEquipmentComponentAction}>
                          <input type="hidden" name="componentId" value={c.id} />
                          <input type="hidden" name="equipmentId" value={equipment.id} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            confirmMessage={`أرشفة "${c.name}"؟`}
                          >
                            أرشفة
                          </ConfirmSubmitButton>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {canWrite && <AddComponentForm equipmentId={equipment.id} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل الصيانة</CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.maintenanceJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              مفيش عمليات صيانة مسجلة لسه — هتظهر هنا أول ما تتسجل من موديول الصيانة.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المهندس</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>القطع/المواد المستهلكة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.maintenanceJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{formatDate(job.startedAt)}</TableCell>
                      <TableCell>{job.engineer.fullNameAr}</TableCell>
                      <TableCell>{JOB_TYPE_LABELS[job.jobType] ?? job.jobType}</TableCell>
                      <TableCell className="max-w-md whitespace-normal break-words">
                        {job.items.length === 0
                          ? "—"
                          : job.items
                              .map(
                                (i) =>
                                  `${i.inventoryItem.nameAr} (${formatNumber(i.quantity.toString())})`
                              )
                              .join("، ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حركات المخزون على المعدة دي</CardTitle>
        </CardHeader>
        <CardContent>
          {stockMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش حركات مخزون مسجلة على المعدة دي لسه.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الصنف</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>بواسطة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{formatDateTime(m.occurredAt)}</TableCell>
                      <TableCell>{m.inventoryItem.nameAr}</TableCell>
                      <TableCell className="font-ltr-display">
                        {Number(m.quantityChange) > 0 ? "+" : ""}
                        {formatNumber(m.quantityChange.toString())}
                      </TableCell>
                      <TableCell>{MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType}</TableCell>
                      <TableCell>{m.performedBy.fullNameAr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل التعديلات</CardTitle>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش تعديلات مسجلة على المعدة دي لسه.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>بواسطة</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((entry) => {
                    const changes = entry.changes as Record<string, unknown> | null;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{formatDateTime(entry.occurredAt)}</TableCell>
                        <TableCell>{entry.actor.fullNameAr}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md whitespace-normal break-words text-muted-foreground">
                          {changes
                            ? Object.entries(changes)
                                .map(
                                  ([key, value]) =>
                                    `${EQUIPMENT_FIELD_LABELS[key] ?? key}: ${String(value ?? "—")}`
                                )
                                .join("، ")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
