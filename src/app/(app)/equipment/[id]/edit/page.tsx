import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EquipmentEditForm } from "./equipment-edit-form";

export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        تعديل <span className="ltr-technical">{equipment.assetTag}</span>
      </h1>
      <EquipmentEditForm equipment={equipment} />
    </div>
  );
}
