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
import {
  EQUIPMENT_STATUS_CLASSES,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from "@/lib/labels";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default async function EquipmentPage() {
  await requirePermission(PERMISSIONS.INVENTORY_READ);

  const equipment = await prisma.equipment.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Package}
        title="المخزون والمعدات"
        description="كل معدة عندها بروفايل مستقل بسجل حركتها الكامل"
        color="blue"
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/equipment/inventory">أصناف المخزون</Link>}
            />
            <Button
              nativeButton={false}
              render={
                <Link href="/equipment/new">
                  <Plus className="size-4" />
                  إضافة معدة
                </Link>
              }
            />
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الرقم التعريفي</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الماركة/الموديل</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  مفيش معدات مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {equipment.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell>
                  <Link
                    href={`/equipment/${eq.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    <span className="ltr-technical">{eq.assetTag}</span>
                  </Link>
                </TableCell>
                <TableCell>{EQUIPMENT_TYPE_LABELS[eq.type] ?? eq.type}</TableCell>
                <TableCell>
                  {eq.brand || eq.model ? (
                    <>
                      {eq.brand}
                      {eq.brand && eq.model && " / "}
                      {eq.model && <span className="ltr-technical">{eq.model}</span>}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={EQUIPMENT_STATUS_CLASSES[eq.status]}
                  >
                    {EQUIPMENT_STATUS_LABELS[eq.status] ?? eq.status}
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
