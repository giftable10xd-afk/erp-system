import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CustomerEditForm } from "./customer-edit-form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل {customer.nameAr}</h1>
      <CustomerEditForm
        customer={{
          id: customer.id,
          nameAr: customer.nameAr,
          phone: customer.phone ?? "",
          taxId: customer.taxId ?? "",
          type: customer.type,
        }}
      />
    </div>
  );
}
