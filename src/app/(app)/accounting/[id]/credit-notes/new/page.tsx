import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CreditNoteForm } from "./credit-note-form";

export default async function NewCreditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { creditNotes: true },
  });
  if (!invoice) notFound();

  const alreadyCredited = invoice.creditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);
  const maxCreditable = Number(invoice.total) - alreadyCredited;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        إشعار دائن — <span className="ltr-technical">{invoice.invoiceNumber}</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        الحد الأقصى القابل للإرجاع من الفاتورة دي: {maxCreditable.toFixed(2)}
      </p>
      <CreditNoteForm invoiceId={invoice.id} />
    </div>
  );
}
