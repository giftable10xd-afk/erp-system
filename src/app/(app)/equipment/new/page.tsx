import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { EquipmentForm } from "./equipment-form";

export default async function NewEquipmentPage() {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة معدة جديدة</h1>
      <EquipmentForm />
    </div>
  );
}
