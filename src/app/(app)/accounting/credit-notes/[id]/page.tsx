import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatCurrency } from "@/lib/format";
import { FileText } from "lucide-react";

export default async function CreditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const { id } = await params;

  const creditNote = await prisma.creditNote.findUnique({
    where: { id },
    include: { customer: true, lineItems: true, invoice: true },
  });

  if (!creditNote) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ltr-technical">{creditNote.creditNoteNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {creditNote.customer.nameAr} — {formatDate(creditNote.issueDate)} — مقابل{" "}
            <Link
              href={`/accounting/${creditNote.invoiceId}`}
              className="text-primary hover:underline"
            >
              <span className="ltr-technical">{creditNote.invoice.invoiceNumber}</span>
            </Link>
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/api/credit-notes/${creditNote.id}/pdf`} target="_blank">
              <FileText className="size-4" />
              طباعة/PDF
            </Link>
          }
        />
      </div>

      {creditNote.reason && (
        <Card>
          <CardHeader>
            <CardTitle>السبب</CardTitle>
          </CardHeader>
          <CardContent>{creditNote.reason}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>البنود</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {creditNote.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">
              <span>{item.description}</span>
              <span className="ltr-technical">
                {formatNumber(item.quantity.toString())} × {formatCurrency(item.unitPrice.toString())} ={" "}
                {formatCurrency(item.lineTotal.toString())}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>الإجمالي المرتجع</span>
            <span>{formatCurrency(creditNote.total.toString())}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
