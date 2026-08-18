import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatNumber, formatCurrency } from "@/lib/format";
import { QUOTE_STATUS_CLASSES, QUOTE_STATUS_LABELS } from "@/lib/labels";
import { updateQuoteStatusAction, convertQuoteToInvoiceAction } from "@/lib/actions/quote-actions";
import { emailQuoteAction } from "@/lib/actions/email-actions";
import { FileText } from "lucide-react";
import { EmailSendButton } from "@/components/email-send-button";

const NEXT_STATUS_LABELS: Record<string, string> = {
  sent: "إرسال العرض",
  accepted: "تسجيل موافقة العميل",
  rejected: "تسجيل رفض العميل",
  expired: "انتهاء الصلاحية",
};

const TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "expired"],
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.QUOTE_READ);
  const canWrite = session.permissions.has(PERMISSIONS.QUOTE_WRITE);
  const canConvert = session.permissions.has(PERMISSIONS.ACCOUNTING_WRITE);
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, lineItems: true, convertedInvoice: true },
  });

  if (!quote) notFound();

  const availableTransitions = TRANSITIONS[quote.status] ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ltr-technical">{quote.quoteNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {quote.customer.nameAr} — {formatDate(quote.issueDate)}
            {quote.expiryDate && <> — ينتهي في {formatDate(quote.expiryDate)}</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={QUOTE_STATUS_CLASSES[quote.status]}>
            {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
          </Badge>
          {canWrite && quote.status === "draft" && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/accounting/quotes/${quote.id}/edit`}>تعديل بنود العرض</Link>}
            />
          )}
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/api/quotes/${quote.id}/pdf`} target="_blank">
                <FileText className="size-4" />
                طباعة/PDF
              </Link>
            }
          />
        </div>
      </div>

      {canWrite && (
        <EmailSendButton
          action={emailQuoteAction}
          hiddenFieldName="quoteId"
          hiddenFieldValue={quote.id}
          customerHasEmail={Boolean(quote.customer.email)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>بنود العرض</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {quote.lineItems.map((item) => (
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
            <span>{formatCurrency(quote.total.toString())}</span>
          </div>
        </CardContent>
      </Card>

      {quote.status === "converted" && quote.convertedInvoice && (
        <Card>
          <CardContent className="flex items-center justify-between pt-6 text-sm">
            <span className="text-muted-foreground">تم تحويل العرض لفاتورة</span>
            <Link
              href={`/accounting/${quote.convertedInvoice.id}`}
              className="text-primary hover:underline"
            >
              <span className="ltr-technical">{quote.convertedInvoice.invoiceNumber}</span>
            </Link>
          </CardContent>
        </Card>
      )}

      {canWrite && availableTransitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTransitions.map((next) => (
            <form key={next} action={updateQuoteStatusAction}>
              <input type="hidden" name="quoteId" value={quote.id} />
              <input type="hidden" name="nextStatus" value={next} />
              <Button
                type="submit"
                variant={next === "rejected" || next === "expired" ? "outline" : "default"}
              >
                {NEXT_STATUS_LABELS[next] ?? next}
              </Button>
            </form>
          ))}
        </div>
      )}

      {canConvert && quote.status === "accepted" && (
        <form action={convertQuoteToInvoiceAction} className="w-fit">
          <input type="hidden" name="quoteId" value={quote.id} />
          <Button type="submit">تحويل لفاتورة</Button>
        </form>
      )}
    </div>
  );
}
