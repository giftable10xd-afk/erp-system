import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MaintenanceJobForm } from "./maintenance-job-form";

export default async function NewMaintenanceJobPage() {
  await requirePermission(PERMISSIONS.MAINTENANCE_CREATE);

  const [equipment, inventoryItems] = await Promise.all([
    prisma.equipment.findMany({
      orderBy: { assetTag: "asc" },
      include: { components: { orderBy: { name: "asc" } } },
    }),
    prisma.inventoryItem.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
  ]);

  const equipmentData = equipment.map((eq) => ({
    id: eq.id,
    assetTag: eq.assetTag,
    components: eq.components.map((c) => ({ id: c.id, name: c.name })),
  }));

  const inventoryData = inventoryItems.map((item) => ({
    id: item.id,
    nameAr: item.nameAr,
    unit: item.unit,
    currentQuantity: item.currentQuantity.toString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تسجيل صيانة</h1>
      <MaintenanceJobForm equipment={equipmentData} inventoryItems={inventoryData} />
    </div>
  );
}
