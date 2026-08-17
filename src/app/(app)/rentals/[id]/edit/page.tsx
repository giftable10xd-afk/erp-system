import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RentalContractEditForm } from "./rental-contract-edit-form";

export default async function EditRentalContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const { id } = await params;

  const contract = await prisma.rentalContract.findUnique({ where: { id } });
  if (!contract) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        تعديل عقد <span className="ltr-technical">{contract.contractNumber}</span>
      </h1>
      <RentalContractEditForm
        contract={{
          id: contract.id,
          expectedReturnDate: contract.expectedReturnDate.toISOString().slice(0, 10),
          rateAmount: contract.rateAmount.toString(),
          isRecurring: contract.isRecurring,
          recurringDayOfMonth: contract.recurringDayOfMonth,
        }}
      />
    </div>
  );
}
