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
import { Boxes, Pencil, Plus } from "lucide-react";
import { StockInForm } from "./stock-in-form";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { archiveInventoryItemAction } from "@/lib/actions/inventory-actions";

export default async function InventoryItemsPage() {
  const session = await requirePermission(PERMISSIONS.INVENTORY_READ);
  const canWrite = session.permissions.has(PERMISSIONS.INVENTORY_WRITE);

  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Boxes}
        title="أصناف المخزون"
        description="المواد وقطع الغيار اللي بتتستهلك في الصيانة والإيجارات"
        color="cyan"
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/equipment">المعدات</Link>}
            />
            {canWrite && (
              <Button
                nativeButton={false}
                render={
                  <Link href="/equipment/inventory/new">
                    <Plus className="size-4" />
                    إضافة صنف
                  </Link>
                }
              />
            )}
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الوحدة</TableHead>
              <TableHead>الرصيد الحالي</TableHead>
              <TableHead>حد إعادة الطلب</TableHead>
              {canWrite && <TableHead>توريد</TableHead>}
              {canWrite && <TableHead>إجراء</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={canWrite ? 7 : 5} className="text-center text-muted-foreground">
                  مفيش أصناف مسجلة لسه
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const isLow = Number(item.currentQuantity) <= Number(item.reorderLevel);
              return (
                <TableRow key={item.id}>
                  <TableCell className="ltr-technical">{item.sku}</TableCell>
                  <TableCell>{item.nameAr}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <span>{formatNumber(item.currentQuantity.toString())}</span>
                    {isLow && (
                      <Badge
                        variant="outline"
                        className="ms-2 bg-status-maintenance-bg text-status-maintenance"
                      >
                        رصيد منخفض
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatNumber(item.reorderLevel.toString())}</TableCell>
                  {canWrite && (
                    <TableCell>
                      <StockInForm inventoryItemId={item.id} />
                    </TableCell>
                  )}
                  {canWrite && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={
                            <Link href={`/equipment/inventory/${item.id}/edit`}>
                              <Pencil className="size-3.5" />
                              تعديل
                            </Link>
                          }
                        />
                        <form action={archiveInventoryItemAction}>
                          <input type="hidden" name="inventoryItemId" value={item.id} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            confirmMessage={`أرشفة "${item.nameAr}"؟ هيختفي من قائمة الأصناف.`}
                          >
                            أرشفة
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
