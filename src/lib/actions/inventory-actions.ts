"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

const equipmentSchema = z.object({
  assetTag: z.string().min(1, "الرقم التعريفي مطلوب"),
  type: z.string().min(1, "نوع المعدة مطلوب"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type ActionState = { error?: string } | undefined;

export async function createEquipmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = equipmentSchema.safeParse({
    assetTag: formData.get("assetTag"),
    type: formData.get("type"),
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    serialNumber: formData.get("serialNumber") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existing = await prisma.equipment.findUnique({
    where: { assetTag: parsed.data.assetTag },
  });
  if (existing) {
    return { error: "الرقم التعريفي ده مستخدم بالفعل لمعدة تانية" };
  }

  let newId = "";
  await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.create({ data: parsed.data });
    newId = equipment.id;
    await recordAudit(tx, {
      entityType: "Equipment",
      entityId: equipment.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/equipment");
  redirect(`/equipment/${newId}`);
}

const equipmentUpdateSchema = equipmentSchema.extend({
  equipmentId: z.string().min(1),
  status: z.enum(["active", "in_maintenance", "rented", "retired"]),
});

export async function updateEquipmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = equipmentUpdateSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    assetTag: formData.get("assetTag"),
    type: formData.get("type"),
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    serialNumber: formData.get("serialNumber") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { equipmentId, ...data } = parsed.data;

  const conflict = await prisma.equipment.findUnique({ where: { assetTag: data.assetTag } });
  if (conflict && conflict.id !== equipmentId) {
    return { error: "الرقم التعريفي ده مستخدم بالفعل لمعدة تانية" };
  }

  await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.update({ where: { id: equipmentId }, data });
    await recordAudit(tx, {
      entityType: "Equipment",
      entityId: equipment.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath("/equipment");
  revalidatePath(`/equipment/${equipmentId}`);
  redirect(`/equipment/${equipmentId}`);
}

const componentSchema = z.object({
  equipmentId: z.string().min(1),
  componentType: z.enum(["filter", "oil", "injector", "other_part"]),
  name: z.string().min(1, "اسم القطعة مطلوب"),
  installedAt: z.string().optional(),
  nextDueAt: z.string().optional(),
});

export async function addEquipmentComponentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = componentSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    componentType: formData.get("componentType"),
    name: formData.get("name"),
    installedAt: formData.get("installedAt") || undefined,
    nextDueAt: formData.get("nextDueAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const component = await tx.equipmentComponent.create({
      data: {
        equipmentId: parsed.data.equipmentId,
        componentType: parsed.data.componentType,
        name: parsed.data.name,
        installedAt: parsed.data.installedAt
          ? new Date(parsed.data.installedAt)
          : undefined,
        nextDueAt: parsed.data.nextDueAt
          ? new Date(parsed.data.nextDueAt)
          : undefined,
      },
    });
    await recordAudit(tx, {
      entityType: "EquipmentComponent",
      entityId: component.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath(`/equipment/${parsed.data.equipmentId}`);
}

export async function archiveEquipmentComponentAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const componentId = formData.get("componentId") as string;
  const equipmentId = formData.get("equipmentId") as string;

  await prisma.$transaction(async (tx) => {
    const component = await tx.equipmentComponent.update({
      where: { id: componentId },
      data: { isActive: false },
    });
    await recordAudit(tx, {
      entityType: "EquipmentComponent",
      entityId: component.id,
      action: "update",
      actorUserId: session.id,
      changes: { isActive: false },
    });
  });

  revalidatePath(`/equipment/${equipmentId}`);
}

const inventoryItemSchema = z.object({
  sku: z.string().min(1, "الكود مطلوب"),
  nameAr: z.string().min(1, "اسم الصنف مطلوب"),
  unit: z.string().min(1, "وحدة القياس مطلوبة"),
  reorderLevel: z.coerce.number().min(0),
});

export async function createInventoryItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = inventoryItemSchema.safeParse({
    sku: formData.get("sku"),
    nameAr: formData.get("nameAr"),
    unit: formData.get("unit"),
    reorderLevel: formData.get("reorderLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const existing = await prisma.inventoryItem.findUnique({ where: { sku: parsed.data.sku } });
  if (existing) {
    return { error: "الكود ده مستخدم بالفعل لصنف تاني" };
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
      data: {
        sku: parsed.data.sku,
        nameAr: parsed.data.nameAr,
        unit: parsed.data.unit,
        reorderLevel: parsed.data.reorderLevel,
        currentQuantity: 0,
      },
    });
    await recordAudit(tx, {
      entityType: "InventoryItem",
      entityId: item.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/equipment/inventory");
  redirect("/equipment/inventory");
}

const inventoryItemUpdateSchema = inventoryItemSchema.extend({
  inventoryItemId: z.string().min(1),
});

export async function updateInventoryItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = inventoryItemUpdateSchema.safeParse({
    inventoryItemId: formData.get("inventoryItemId"),
    sku: formData.get("sku"),
    nameAr: formData.get("nameAr"),
    unit: formData.get("unit"),
    reorderLevel: formData.get("reorderLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { inventoryItemId, ...data } = parsed.data;

  const conflict = await prisma.inventoryItem.findUnique({ where: { sku: data.sku } });
  if (conflict && conflict.id !== inventoryItemId) {
    return { error: "الكود ده مستخدم بالفعل لصنف تاني" };
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.update({ where: { id: inventoryItemId }, data });
    await recordAudit(tx, {
      entityType: "InventoryItem",
      entityId: item.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath("/equipment/inventory");
  redirect("/equipment/inventory");
}

export async function archiveInventoryItemAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const inventoryItemId = formData.get("inventoryItemId") as string;

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { isActive: false },
    });
    await recordAudit(tx, {
      entityType: "InventoryItem",
      entityId: item.id,
      action: "update",
      actorUserId: session.id,
      changes: { isActive: false },
    });
  });

  revalidatePath("/equipment/inventory");
}

const stockInSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.coerce.number().positive("الكمية لازم تكون أكبر من صفر"),
});

export async function recordStockInAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.INVENTORY_WRITE);

  const parsed = stockInSchema.safeParse({
    inventoryItemId: formData.get("inventoryItemId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.update({
      where: { id: parsed.data.inventoryItemId },
      data: { currentQuantity: { increment: parsed.data.quantity } },
    });
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId: parsed.data.inventoryItemId,
        quantityChange: parsed.data.quantity,
        movementType: "purchase_in",
        performedByUserId: session.id,
      },
    });
    await recordAudit(tx, {
      entityType: "StockMovement",
      entityId: movement.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/equipment/inventory");
}
