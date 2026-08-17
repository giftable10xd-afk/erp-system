import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RentalContractForm } from "./rental-contract-form";

export default async function NewRentalContractPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const params = await searchParams;

  const [customers, availableEquipment] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
    prisma.equipment.findMany({ where: { status: "active" }, orderBy: { assetTag: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">عقد إيجار جديد</h1>
      <RentalContractForm
        customers={customers.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
        equipment={availableEquipment.map((e) => ({ id: e.id, assetTag: e.assetTag }))}
        defaultCustomerId={params.customerId}
      />
    </div>
  );
}
