import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { TicketForm } from "./ticket-form";

export default async function NewTicketPage() {
  await requirePermission(PERMISSIONS.SUPPORT_WRITE);

  const [customers, equipment] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
    prisma.equipment.findMany({ orderBy: { assetTag: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">طلب دعم جديد</h1>
      <TicketForm
        customers={customers.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
        equipment={equipment.map((e) => ({ id: e.id, assetTag: e.assetTag }))}
      />
    </div>
  );
}
