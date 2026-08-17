import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InventoryItemEditForm } from "./inventory-item-edit-form";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل {item.nameAr}</h1>
      <InventoryItemEditForm
        item={{
          id: item.id,
          sku: item.sku,
          nameAr: item.nameAr,
          unit: item.unit,
          reorderLevel: item.reorderLevel.toString(),
        }}
      />
    </div>
  );
}
