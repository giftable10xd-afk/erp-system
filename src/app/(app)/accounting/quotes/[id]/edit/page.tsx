import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { QuoteEditForm } from "./quote-edit-form";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.QUOTE_WRITE);
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!quote) notFound();
  if (quote.status !== "draft") redirect(`/accounting/quotes/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        تعديل بنود <span className="ltr-technical">{quote.quoteNumber}</span>
      </h1>
      <QuoteEditForm
        quoteId={quote.id}
        lineItems={quote.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity.toString(),
          unitPrice: li.unitPrice.toString(),
          taxRate: li.taxRate.toString(),
        }))}
      />
    </div>
  );
}
