import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InvoiceEditForm } from "./invoice-edit-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/accounting/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        تعديل بنود <span className="ltr-technical">{invoice.invoiceNumber}</span>
      </h1>
      <InvoiceEditForm
        invoiceId={invoice.id}
        lineItems={invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity.toString(),
          unitPrice: li.unitPrice.toString(),
          taxRate: li.taxRate.toString(),
        }))}
      />
    </div>
  );
}
