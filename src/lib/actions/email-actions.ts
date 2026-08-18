"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { renderPdfFromUrl } from "@/lib/pdf";
import { getSettings } from "@/lib/settings";

export type EmailActionState = { error?: string; success?: boolean } | undefined;

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend من غير دومين موثّق مبيبعتش إلا من onboarding@resend.dev، ولحساب
// المالك بس (قيد الـsandbox بتاع Resend نفسه) — لحد ما يتضاف ويتوثّق دومين
// حقيقي من resend.com/domains.
const FROM_ADDRESS = "onboarding@resend.dev";

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function emailInvoiceAction(
  _prevState: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_READ);
  const invoiceId = formData.get("invoiceId") as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true },
  });
  if (!invoice) return { error: "الفاتورة مش موجودة" };
  if (!invoice.customer.email) return { error: "العميل ده مفيهوش بريد إلكتروني مسجل" };

  const settings = await getSettings();
  const h = await headers();
  const origin = await getOrigin();
  const printUrl = `${origin}/accounting/${invoiceId}/print`;
  const pdfBuffer = await renderPdfFromUrl(printUrl, h.get("cookie") ?? "");

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: invoice.customer.email,
    subject: `فاتورة ${invoice.invoiceNumber} — ${settings.companyNameAr}`,
    html: `<div dir="rtl">مرفق فاتورة رقم <b>${invoice.invoiceNumber}</b> من ${settings.companyNameAr}.</div>`,
    attachments: [
      { filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer },
    ],
  });

  if (error) {
    return { error: `فشل إرسال البريد: ${error.message}` };
  }

  await recordAudit(prisma, {
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    actorUserId: session.id,
    changes: { emailedTo: invoice.customer.email },
  });

  return { success: true };
}

export async function emailQuoteAction(
  _prevState: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const session = await requirePermission(PERMISSIONS.QUOTE_READ);
  const quoteId = formData.get("quoteId") as string;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });
  if (!quote) return { error: "عرض السعر مش موجود" };
  if (!quote.customer.email) return { error: "العميل ده مفيهوش بريد إلكتروني مسجل" };

  const settings = await getSettings();
  const h = await headers();
  const origin = await getOrigin();
  const printUrl = `${origin}/accounting/quotes/${quoteId}/print`;
  const pdfBuffer = await renderPdfFromUrl(printUrl, h.get("cookie") ?? "");

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: quote.customer.email,
    subject: `عرض سعر ${quote.quoteNumber} — ${settings.companyNameAr}`,
    html: `<div dir="rtl">مرفق عرض سعر رقم <b>${quote.quoteNumber}</b> من ${settings.companyNameAr}.</div>`,
    attachments: [
      { filename: `${quote.quoteNumber}.pdf`, content: pdfBuffer },
    ],
  });

  if (error) {
    return { error: `فشل إرسال البريد: ${error.message}` };
  }

  await recordAudit(prisma, {
    entityType: "Quote",
    entityId: quoteId,
    action: "update",
    actorUserId: session.id,
    changes: { emailedTo: quote.customer.email },
  });

  return { success: true };
}
