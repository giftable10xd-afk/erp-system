import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDate, formatNumber, formatCurrency } from "@/lib/format";
import { QUOTE_STATUS_LABELS } from "@/lib/labels";
import { PrintDocumentHeader } from "@/components/print-document-header";

export default async function PortalQuotePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const [quote, settings] = await Promise.all([
    prisma.quote.findUnique({
      where: { id },
      include: { customer: true, lineItems: true },
    }),
    getSettings(),
  ]);

  if (!quote || !token || quote.customer.portalToken !== token) notFound();

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-foreground print:p-0">
      <PrintDocumentHeader
        documentTitleAr="عرض سعر"
        documentNumber={quote.quoteNumber}
        issueDate={quote.issueDate}
        settings={settings}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">العميل</p>
          <p className="font-medium">{quote.customer.nameAr}</p>
        </div>
        <div className="text-end text-sm">
          <p className="text-muted-foreground">الحالة</p>
          <p className="font-medium">{QUOTE_STATUS_LABELS[quote.status] ?? quote.status}</p>
          {quote.expiryDate && (
            <>
              <p className="mt-2 text-muted-foreground">ينتهي في</p>
              <p className="font-medium">{formatDate(quote.expiryDate)}</p>
            </>
          )}
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
          {quote.lineItems.map((item) => (
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
          <span>الإجمالي</span>
          <span>{formatCurrency(quote.total.toString())}</span>
        </div>
      </div>
    </div>
  );
}
