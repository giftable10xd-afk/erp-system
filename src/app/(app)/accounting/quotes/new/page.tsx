import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage() {
  await requirePermission(PERMISSIONS.QUOTE_WRITE);

  const [customers, rentalContracts] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { nameAr: "asc" } }),
    prisma.rentalContract.findMany({
      orderBy: { startDate: "desc" },
      take: 30,
      include: { customer: true, equipment: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">عرض سعر جديد</h1>
      <QuoteForm
        customers={customers.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
        rentalContracts={rentalContracts.map((c) => ({
          id: c.id,
          label: `${c.contractNumber} — ${c.customer.nameAr} — ${c.equipment.assetTag}`,
          customerId: c.customerId,
          rateAmount: c.rateAmount.toString(),
        }))}
      />
    </div>
  );
}
