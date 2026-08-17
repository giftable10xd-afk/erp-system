import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatNumber, formatCurrency } from "@/lib/format";
import { PrintDocumentHeader } from "@/components/print-document-header";

export default async function CreditNotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const { id } = await params;

  const [creditNote, settings] = await Promise.all([
    prisma.creditNote.findUnique({
      where: { id },
      include: { customer: true, lineItems: true, invoice: true },
    }),
    getSettings(),
  ]);

  if (!creditNote) notFound();

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-foreground print:p-0">
      <PrintDocumentHeader
        documentTitleAr="إشعار دائن"
        documentNumber={creditNote.creditNoteNumber}
        issueDate={creditNote.issueDate}
        settings={settings}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">العميل</p>
          <p className="font-medium">{creditNote.customer.nameAr}</p>
        </div>
        <div className="text-end">
          <p className="text-muted-foreground">مقابل فاتورة</p>
          <p className="ltr-technical font-medium">{creditNote.invoice.invoiceNumber}</p>
        </div>
      </div>

      {creditNote.reason && (
        <p className="mb-6 text-sm text-muted-foreground">السبب: {creditNote.reason}</p>
      )}

      <table className="mb-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-end">
            <th className="py-2 text-start font-medium">الوصف</th>
            <th className="py-2 font-medium">الكمية</th>
            <th className="py-2 font-medium">سعر الوحدة</th>
            <th className="py-2 font-medium">الضريبة</th>
            <th className="py-2 font-medium">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {creditNote.lineItems.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-center">{formatNumber(item.quantity.toString())}</td>
              <td className="py-2 text-center">{formatCurrency(item.unitPrice.toString())}</td>
              <td className="py-2 text-center">{formatNumber(item.taxRate.toString())}%</td>
              <td className="py-2 text-center">{formatCurrency(item.lineTotal.toString())}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex w-56 justify-between border-t pt-1 font-bold">
          <span>الإجمالي المرتجع</span>
          <span>{formatCurrency(creditNote.total.toString())}</span>
        </div>
      </div>
    </div>
  );
}
