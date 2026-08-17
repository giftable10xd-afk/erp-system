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

const invoiceSchema = z.object({
  customerId: z.string().min(1, "لازم تختار العميل"),
  rentalContractId: z.string().optional(),
  maintenanceJobId: z.string().optional(),
});

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

export async function createInvoiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);

  const parsedInvoice = invoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    rentalContractId: formData.get("rentalContractId") || undefined,
    maintenanceJobId: formData.get("maintenanceJobId") || undefined,
  });

  if (!parsedInvoice.success) {
    return { error: parsedInvoice.error.issues[0]?.message ?? "بيانات غير صحيحة" };
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
    return { error: "لازم تضيف بند واحد على الأقل في الفاتورة" };
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

    const referenceType = parsedInvoice.data.rentalContractId
      ? "RentalContract"
      : parsedInvoice.data.maintenanceJobId
        ? "MaintenanceJob"
        : "manual";

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerId: parsedInvoice.data.customerId,
        status: "draft",
        referenceType,
        rentalContractId: parsedInvoice.data.rentalContractId || undefined,
        maintenanceJobId: parsedInvoice.data.maintenanceJobId || undefined,
        total,
        lineItems: { create: lineItemsData },
      },
    });
    newId = invoice.id;

    await recordAudit(tx, {
      entityType: "Invoice",
      entityId: invoice.id,
      action: "create",
      actorUserId: session.id,
      changes: { total, lines: lineRows.length },
    });
  });

  revalidatePath("/accounting");
  redirect(`/accounting/${newId}`);
}

export async function updateInvoiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const invoiceId = formData.get("invoiceId") as string;

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
    return { error: "لازم تضيف بند واحد على الأقل في الفاتورة" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
      if (invoice.status !== "draft") {
        throw new Error("مينفعش تعدل فاتورة صادرة بالفعل");
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

      await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { total, lineItems: { create: lineItemsData } },
      });

      await recordAudit(tx, {
        entityType: "Invoice",
        entityId: invoiceId,
        action: "update",
        actorUserId: session.id,
        changes: { total, lines: lineRows.length },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حصل خطأ أثناء تعديل الفاتورة" };
  }

  revalidatePath(`/accounting/${invoiceId}`);
  revalidatePath("/accounting");
  redirect(`/accounting/${invoiceId}`);
}

export async function cancelInvoiceAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const invoiceId = formData.get("invoiceId") as string;

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (invoice.payments.length > 0) {
      throw new Error("مينفعش تلغي فاتورة عليها دفعات مسجلة");
    }

    await tx.invoice.update({ where: { id: invoiceId }, data: { status: "cancelled" } });
    await recordAudit(tx, {
      entityType: "Invoice",
      entityId: invoiceId,
      action: "update",
      actorUserId: session.id,
      changes: { status: "cancelled" },
    });
  });

  revalidatePath(`/accounting/${invoiceId}`);
  revalidatePath("/accounting");
}

export async function issueInvoiceAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);
  const invoiceId = formData.get("invoiceId") as string;

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "issued" },
    });
    await recordAudit(tx, {
      entityType: "Invoice",
      entityId: invoice.id,
      action: "update",
      actorUserId: session.id,
      changes: { status: "issued" },
    });
  });

  revalidatePath(`/accounting/${invoiceId}`);
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("المبلغ لازم يكون أكبر من صفر"),
  method: z.enum(["cash", "bank_transfer", "check"]),
});

export async function recordPaymentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.ACCOUNTING_WRITE);

  const parsed = paymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId: parsed.data.invoiceId,
        amount: parsed.data.amount,
        method: parsed.data.method,
      },
    });

    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: parsed.data.invoiceId },
      include: { payments: true },
    });
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    if (totalPaid >= Number(invoice.total)) {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: "paid" } });
    }

    await recordAudit(tx, {
      entityType: "Payment",
      entityId: payment.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath(`/accounting/${parsed.data.invoiceId}`);
}
