import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { issueInvoiceAction, cancelInvoiceAction } from "@/lib/actions/invoice-actions";
import { emailInvoiceAction } from "@/lib/actions/email-actions";
import { FileText } from "lucide-react";
import { PaymentForm } from "./payment-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmailSendButton } from "@/components/email-send-button";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const canWrite = session.permissions.has(PERMISSIONS.ACCOUNTING_WRITE);
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      lineItems: true,
      payments: { orderBy: { paidAt: "desc" } },
      creditNotes: { orderBy: { issueDate: "desc" } },
    },
  });

  if (!invoice) notFound();

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const credited = invoice.creditNotes.reduce((sum, cn) => sum + Number(cn.total), 0);
  const remaining = Number(invoice.total) - paid - credited;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ltr-technical">{invoice.invoiceNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoice.customer.nameAr} — {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={INVOICE_STATUS_CLASSES[invoice.status]}>
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </Badge>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                <FileText className="size-4" />
                طباعة/PDF
              </Link>
            }
          />
        </div>
      </div>

      {canWrite && (
        <EmailSendButton
          action={emailInvoiceAction}
          hiddenFieldName="invoiceId"
          hiddenFieldValue={invoice.id}
          customerHasEmail={Boolean(invoice.customer.email)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>بنود الفاتورة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {invoice.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">
              <span>{item.description}</span>
              <span className="ltr-technical">
                {formatNumber(item.quantity.toString())} × {formatCurrency(item.unitPrice.toString())} ={" "}
                {formatCurrency(item.lineTotal.toString())}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>الإجمالي</span>
            <span>{formatCurrency(invoice.total.toString())}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">الإجمالي</CardTitle>
          </CardHeader>
          <CardContent>{formatCurrency(invoice.total.toString())}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">المدفوع</CardTitle>
          </CardHeader>
          <CardContent>{formatCurrency(paid.toString())}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">المتبقي</CardTitle>
          </CardHeader>
          <CardContent className="font-bold">{formatCurrency(remaining.toString())}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الدفعات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش دفعات مسجلة</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</span>
                  <span>
                    {formatCurrency(p.amount.toString())} — {formatDate(p.paidAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canWrite && invoice.status !== "paid" && remaining > 0 && (
            <PaymentForm invoiceId={invoice.id} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إشعارات الدائن</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {invoice.creditNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش إشعارات دائن مسجلة</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {invoice.creditNotes.map((cn) => (
                <li key={cn.id} className="flex justify-between border-b pb-2 last:border-0">
                  <Link
                    href={`/accounting/credit-notes/${cn.id}`}
                    className="text-primary hover:underline"
                  >
                    <span className="ltr-technical">{cn.creditNoteNumber}</span>
                  </Link>
                  <span>
                    {formatCurrency(cn.total.toString())} — {formatDate(cn.issueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canWrite && (invoice.status === "issued" || invoice.status === "paid") && remaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              nativeButton={false}
              render={<Link href={`/accounting/${invoice.id}/credit-notes/new`}>إصدار إشعار دائن</Link>}
            />
          )}
        </CardContent>
      </Card>

      {canWrite && invoice.status === "draft" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/accounting/${invoice.id}/edit`}>تعديل بنود الفاتورة</Link>}
          />
          <form action={issueInvoiceAction} className="w-fit">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button type="submit">إصدار الفاتورة</Button>
          </form>
          {paid === 0 && (
            <form action={cancelInvoiceAction} className="w-fit">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <ConfirmSubmitButton variant="destructive" confirmMessage="إلغاء الفاتورة دي؟">
                إلغاء
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
