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

const creditNoteSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().optional(),
});

function generateCreditNoteNumber() {
  return `CRN-${Date.now().toString(36).toUpperCase()}`;
}

export async function createCreditNoteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);

  const parsed = creditNoteSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
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
    return { error: "لازم تضيف بند واحد على الأقل في إشعار الدائن" };
  }

  let newId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: parsed.data.invoiceId },
        include: { creditNotes: true },
      });

      if (invoice.status !== "issued" && invoice.status !== "paid") {
        throw new Error("مينفعش تصدر إشعار دائن إلا لفاتورة صادرة أو مدفوعة");
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

      const alreadyCredited = invoice.creditNotes.reduce(
        (sum, cn) => sum + Number(cn.total),
        0
      );
      if (alreadyCredited + total > Number(invoice.total)) {
        throw new Error("إجمالي الإشعارات هيتخطى قيمة الفاتورة");
      }

      const creditNote = await tx.creditNote.create({
        data: {
          creditNoteNumber: generateCreditNoteNumber(),
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          reason: parsed.data.reason,
          total,
          lineItems: { create: lineItemsData },
        },
      });
      newId = creditNote.id;

      await recordAudit(tx, {
        entityType: "CreditNote",
        entityId: creditNote.id,
        action: "create",
        actorUserId: session.id,
        changes: { invoiceId: invoice.id, total },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حصل خطأ أثناء إصدار إشعار الدائن" };
  }

  revalidatePath(`/accounting/${parsed.data.invoiceId}`);
  revalidatePath("/accounting");
  redirect(`/accounting/credit-notes/${newId}`);
}
