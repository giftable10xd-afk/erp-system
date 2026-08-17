"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
});

const quoteSchema = z.object({
  customerId: z.string().min(1, "لازم تختار العميل"),
  rentalContractId: z.string().optional(),
  expiryDate: z.string().optional(),
});

function generateQuoteNumber() {
  return `QUO-${Date.now().toString(36).toUpperCase()}`;
}

export async function createQuoteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.QUOTE_WRITE);

  const parsedQuote = quoteSchema.safeParse({
    customerId: formData.get("customerId"),
    rentalContractId: formData.get("rentalContractId") || undefined,
    expiryDate: formData.get("expiryDate") || undefined,
  });

  if (!parsedQuote.success) {
    return { error: parsedQuote.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const descriptions = formData.getAll("lineDescription") as string[];
  const quantities = formData.getAll("lineQuantity") as string[];
  const unitPrices = formData.getAll("lineUnitPrice") as string[];
  const taxRates = formData.getAll("lineTaxRate") as string[];

  const lineRows = descriptions
    .map((description, i) => ({
      description,
      quantity: quantities[i],
      unitPrice: unitPrices[i],
      taxRate: taxRates[i] || "0",
    }))
    .filter((r) => r.description)
    .map((r) => lineItemSchema.parse(r));

  if (lineRows.length === 0) {
    return { error: "لازم تضيف بند واحد على الأقل في عرض السعر" };
  }

  let newId = "";
  await prisma.$transaction(async (tx) => {
    let total = 0;
    const lineItemsData = lineRows.map((row) => {
      const subtotal = row.quantity * row.unitPrice;
      const lineTotal = subtotal + subtotal * (row.taxRate / 100);
      total += lineTotal;
      return {
        description: row.description,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        taxRate: row.taxRate,
        lineTotal,
      };
    });

    const referenceType = parsedQuote.data.rentalContractId ? "RentalContract" : "manual";

    const quote = await tx.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        customerId: parsedQuote.data.customerId,
        status: "draft",
        referenceType,
        rentalContractId: parsedQuote.data.rentalContractId || undefined,
        expiryDate: parsedQuote.data.expiryDate
          ? new Date(parsedQuote.data.expiryDate)
          : undefined,
        total,
        lineItems: { create: lineItemsData },
      },
    });
    newId = quote.id;

    await recordAudit(tx, {
      entityType: "Quote",
      entityId: quote.id,
      action: "create",
      actorUserId: session.id,
      changes: { total, lines: lineRows.length },
    });
  });

  revalidatePath("/accounting/quotes");
  redirect(`/accounting/quotes/${newId}`);
}

export async function updateQuoteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.QUOTE_WRITE);
  const quoteId = formData.get("quoteId") as string;

  const descriptions = formData.getAll("lineDescription") as string[];
  const quantities = formData.getAll("lineQuantity") as string[];
  const unitPrices = formData.getAll("lineUnitPrice") as string[];
  const taxRates = formData.getAll("lineTaxRate") as string[];

  const lineRows = descriptions
    .map((description, i) => ({
      description,
      quantity: quantities[i],
      unitPrice: unitPrices[i],
      taxRate: taxRates[i] || "0",
    }))
    .filter((r) => r.description)
    .map((r) => lineItemSchema.parse(r));

  if (lineRows.length === 0) {
    return { error: "لازم تضيف بند واحد على الأقل في عرض السعر" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });
      if (quote.status !== "draft") {
        throw new Error("مينفعش تعدل عرض سعر بعد إرساله");
      }

      let total = 0;
      const lineItemsData = lineRows.map((row) => {
        const subtotal = row.quantity * row.unitPrice;
        const lineTotal = subtotal + subtotal * (row.taxRate / 100);
        total += lineTotal;
        return {
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          taxRate: row.taxRate,
          lineTotal,
        };
      });

      await tx.quoteLineItem.deleteMany({ where: { quoteId } });
      await tx.quote.update({
        where: { id: quoteId },
        data: { total, lineItems: { create: lineItemsData } },
      });

      await recordAudit(tx, {
        entityType: "Quote",
        entityId: quoteId,
        action: "update",
        actorUserId: session.id,
        changes: { total, lines: lineRows.length },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حصل خطأ أثناء تعديل عرض السعر" };
  }

  revalidatePath(`/accounting/quotes/${quoteId}`);
  revalidatePath("/accounting/quotes");
  redirect(`/accounting/quotes/${quoteId}`);
}

const QUOTE_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "expired"],
};

export async function updateQuoteStatusAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.QUOTE_WRITE);
  const quoteId = formData.get("quoteId") as string;
  const nextStatus = formData.get("nextStatus") as string;

  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });
    const allowed = QUOTE_TRANSITIONS[quote.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error("انتقال حالة غير مسموح");
    }

    await tx.quote.update({ where: { id: quoteId }, data: { status: nextStatus } });
    await recordAudit(tx, {
      entityType: "Quote",
      entityId: quoteId,
      action: "update",
      actorUserId: session.id,
      changes: { status: nextStatus },
    });
  });

  revalidatePath(`/accounting/quotes/${quoteId}`);
}

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export async function convertQuoteToInvoiceAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const quoteId = formData.get("quoteId") as string;

  let invoiceId = "";
  await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { lineItems: true },
    });

    if (quote.status !== "accepted") {
      throw new Error("لازم يكون عرض السعر متقبَّل قبل التحويل لفاتورة");
    }

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerId: quote.customerId,
        status: "draft",
        referenceType: "manual",
        rentalContractId: quote.rentalContractId ?? undefined,
        total: quote.total,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });
    invoiceId = invoice.id;

    await tx.quote.update({
      where: { id: quoteId },
      data: { status: "converted", convertedInvoiceId: invoice.id },
    });

    await recordAudit(tx, {
      entityType: "Quote",
      entityId: quoteId,
      action: "update",
      actorUserId: session.id,
      changes: { status: "converted", convertedInvoiceId: invoice.id },
    });
    await recordAudit(tx, {
      entityType: "Invoice",
      entityId: invoice.id,
      action: "create",
      actorUserId: session.id,
      changes: { sourceQuoteId: quoteId },
    });
  });

  revalidatePath("/accounting/quotes");
  revalidatePath("/accounting");
  redirect(`/accounting/${invoiceId}`);
}
