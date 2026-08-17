"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const customerSchema = z.object({
  nameAr: z.string().min(1, "اسم العميل مطلوب"),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  type: z.enum(["individual", "company"]),
});

export async function createCustomerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);

  const parsed = customerSchema.safeParse({
    nameAr: formData.get("nameAr"),
    phone: formData.get("phone") || undefined,
    taxId: formData.get("taxId") || undefined,
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  let newId = "";
  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({ data: parsed.data });
    newId = customer.id;
    await recordAudit(tx, {
      entityType: "Customer",
      entityId: customer.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/rentals/customers");
  redirect(`/rentals/new?customerId=${newId}`);
}

const customerUpdateSchema = customerSchema.extend({
  customerId: z.string().min(1),
});

export async function updateCustomerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);

  const parsed = customerUpdateSchema.safeParse({
    customerId: formData.get("customerId"),
    nameAr: formData.get("nameAr"),
    phone: formData.get("phone") || undefined,
    taxId: formData.get("taxId") || undefined,
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { customerId, ...data } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.update({ where: { id: customerId }, data });
    await recordAudit(tx, {
      entityType: "Customer",
      entityId: customer.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath("/rentals/customers");
  redirect("/rentals/customers");
}

export async function archiveCustomerAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const customerId = formData.get("customerId") as string;

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id: customerId },
      data: { isActive: false },
    });
    await recordAudit(tx, {
      entityType: "Customer",
      entityId: customer.id,
      action: "update",
      actorUserId: session.id,
      changes: { isActive: false },
    });
  });

  revalidatePath("/rentals/customers");
}

const contractSchema = z.object({
  customerId: z.string().min(1, "لازم تختار العميل"),
  equipmentId: z.string().min(1, "لازم تختار المعدة"),
  startDate: z.string().min(1),
  expectedReturnDate: z.string().min(1),
  rateAmount: z.coerce.number().positive("قيمة الإيجار لازم تكون أكبر من صفر"),
});

function generateContractNumber() {
  return `RENT-${Date.now().toString(36).toUpperCase()}`;
}

export async function createRentalContractAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);

  const parsed = contractSchema.safeParse({
    customerId: formData.get("customerId"),
    equipmentId: formData.get("equipmentId"),
    startDate: formData.get("startDate"),
    expectedReturnDate: formData.get("expectedReturnDate"),
    rateAmount: formData.get("rateAmount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  let newId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUniqueOrThrow({
        where: { id: parsed.data.equipmentId },
      });
      if (equipment.status !== "active") {
        throw new Error("المعدة دي مش متاحة للإيجار دلوقتي");
      }

      const contract = await tx.rentalContract.create({
        data: {
          contractNumber: generateContractNumber(),
          customerId: parsed.data.customerId,
          equipmentId: parsed.data.equipmentId,
          startDate: new Date(parsed.data.startDate),
          expectedReturnDate: new Date(parsed.data.expectedReturnDate),
          rateAmount: parsed.data.rateAmount,
          status: "active",
        },
      });
      newId = contract.id;

      await tx.equipment.update({
        where: { id: parsed.data.equipmentId },
        data: { status: "rented" },
      });

      await recordAudit(tx, {
        entityType: "RentalContract",
        entityId: contract.id,
        action: "create",
        actorUserId: session.id,
        changes: parsed.data,
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حصل خطأ أثناء إنشاء العقد" };
  }

  revalidatePath("/rentals");
  revalidatePath("/equipment");
  redirect(`/rentals/${newId}`);
}

const contractUpdateSchema = z.object({
  contractId: z.string().min(1),
  expectedReturnDate: z.string().min(1),
  rateAmount: z.coerce.number().positive("قيمة الإيجار لازم تكون أكبر من صفر"),
});

export async function updateRentalContractAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);

  const parsed = contractUpdateSchema.safeParse({
    contractId: formData.get("contractId"),
    expectedReturnDate: formData.get("expectedReturnDate"),
    rateAmount: formData.get("rateAmount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { contractId, ...data } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const contract = await tx.rentalContract.update({
      where: { id: contractId },
      data: { expectedReturnDate: new Date(data.expectedReturnDate), rateAmount: data.rateAmount },
    });
    await recordAudit(tx, {
      entityType: "RentalContract",
      entityId: contract.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath(`/rentals/${contractId}`);
  revalidatePath("/rentals");
  redirect(`/rentals/${contractId}`);
}

export async function cancelRentalContractAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const contractId = formData.get("contractId") as string;

  await prisma.$transaction(async (tx) => {
    const contract = await tx.rentalContract.update({
      where: { id: contractId },
      data: { status: "cancelled" },
    });

    // لو المعدة لسه متسجلة "مؤجرة" بسبب العقد ده، ترجعها متاحة تاني
    const equipment = await tx.equipment.findUnique({ where: { id: contract.equipmentId } });
    if (equipment?.status === "rented") {
      await tx.equipment.update({ where: { id: contract.equipmentId }, data: { status: "active" } });
    }

    await recordAudit(tx, {
      entityType: "RentalContract",
      entityId: contract.id,
      action: "update",
      actorUserId: session.id,
      changes: { status: "cancelled" },
    });
  });

  revalidatePath(`/rentals/${contractId}`);
  revalidatePath("/rentals");
  revalidatePath("/equipment");
  redirect(`/rentals/${contractId}`);
}

export async function returnEquipmentAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const contractId = formData.get("contractId") as string;

  await prisma.$transaction(async (tx) => {
    const contract = await tx.rentalContract.update({
      where: { id: contractId },
      data: { status: "completed", actualReturnDate: new Date() },
    });

    await tx.equipment.update({
      where: { id: contract.equipmentId },
      data: { status: "active" },
    });

    await recordAudit(tx, {
      entityType: "RentalContract",
      entityId: contract.id,
      action: "update",
      actorUserId: session.id,
      changes: { status: "completed" },
    });
  });

  revalidatePath(`/rentals/${contractId}`);
  revalidatePath("/rentals");
  revalidatePath("/equipment");
}
