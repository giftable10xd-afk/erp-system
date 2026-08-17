import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { InventoryItemForm } from "./inventory-item-form";

export default async function NewInventoryItemPage() {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة صنف مخزون</h1>
      <InventoryItemForm />
    </div>
  );
}
