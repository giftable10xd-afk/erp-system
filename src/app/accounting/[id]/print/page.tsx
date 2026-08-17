import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatNumber, formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_LABELS } from "@/lib/labels";
import { PrintDocumentHeader } from "@/components/print-document-header";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const { id } = await params;

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, lineItems: true, payments: true },
    }),
    getSettings(),
  ]);

  if (!invoice) notFound();

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-foreground print:p-0">
      <PrintDocumentHeader
        documentTitleAr="فاتورة"
        documentNumber={invoice.invoiceNumber}
        issueDate={invoice.issueDate}
        settings={settings}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">العميل</p>
          <p className="font-medium">{invoice.customer.nameAr}</p>
          {invoice.customer.phone && (
            <p className="ltr-technical text-muted-foreground">{invoice.customer.phone}</p>
          )}
          {invoice.customer.taxId && (
            <p className="ltr-technical text-muted-foreground">
              الرقم الضريبي: {invoice.customer.taxId}
            </p>
          )}
        </div>
        <div className="text-end">
          <p className="text-muted-foreground">الحالة</p>
          <p className="font-medium">{INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}</p>
        </div>
      </div>

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
          {invoice.lineItems.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-center">{formatNumber(item.quantity.toString())}</td>
              <td className="py-2 text-center">{formatCurrency(item.unitPrice.toString())}</td>
              <td className="py-2 text-center">
                {formatNumber(item.taxRate.toString())}%
              </td>
              <td className="py-2 text-center">{formatCurrency(item.lineTotal.toString())}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex w-56 justify-between">
          <span className="text-muted-foreground">الإجمالي</span>
          <span className="font-medium">{formatCurrency(invoice.total.toString())}</span>
        </div>
        <div className="flex w-56 justify-between">
          <span className="text-muted-foreground">المدفوع</span>
          <span className="font-medium">{formatCurrency(paid.toString())}</span>
        </div>
        <div className="flex w-56 justify-between border-t pt-1 font-bold">
          <span>المتبقي</span>
          <span>{formatCurrency((Number(invoice.total) - paid).toString())}</span>
        </div>
      </div>
    </div>
  );
}
