"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

const partRowSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.coerce.number().positive(),
});

const componentRowSchema = z.object({
  equipmentComponentId: z.string().min(1),
  eventType: z.enum(["changed", "inspected", "replaced"]),
});

const maintenanceJobSchema = z.object({
  equipmentId: z.string().min(1, "لازم تختار المعدة"),
  jobType: z.enum(["routine", "repair", "emergency"]),
  startedAt: z.string().min(1, "تاريخ الصيانة مطلوب"),
  description: z.string().optional(),
});

export type ActionState = { error?: string } | undefined;

/**
 * قلب النظام: تسجيل عملية صيانة، خصم المخزون، وتحديث استحقاقات القطع —
 * كل ده جوه معاملة Postgres واحدة ذرية. لو أي جزء فشل (مثلاً كمية مخزون
 * غير كافية)، العملية كلها بترجع (rollback) — مفيش صيانة متسجلة من غير
 * ما يتخصم اللي اتستهلك فعلًا، ومفيش خصم من غير صيانة مسجلة.
 */
export async function createMaintenanceJobAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.MAINTENANCE_CREATE);

  const parsedJob = maintenanceJobSchema.safeParse({
    equipmentId: formData.get("equipmentId"),
    jobType: formData.get("jobType"),
    startedAt: formData.get("startedAt"),
    description: formData.get("description") || undefined,
  });

  if (!parsedJob.success) {
    return { error: parsedJob.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  // صفوف القطع المستهلكة (parallel arrays من نفس الفورم)
  const itemIds = formData.getAll("partInventoryItemId") as string[];
  const itemQuantities = formData.getAll("partQuantity") as string[];
  const partRows = itemIds
    .map((id, i) => ({ inventoryItemId: id, quantity: itemQuantities[i] }))
    .filter((r) => r.inventoryItemId)
    .map((r) => partRowSchema.parse(r));

  // صفوف القطع اللي اتصانت (فلاتر/زيوت... اختياري)
  const componentIds = formData.getAll("componentId") as string[];
  const componentEvents = formData.getAll("componentEventType") as string[];
  const componentRows = componentIds
    .map((id, i) => ({ equipmentComponentId: id, eventType: componentEvents[i] }))
    .filter((r) => r.equipmentComponentId)
    .map((r) => componentRowSchema.parse(r));

  let newJobId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const job = await tx.maintenanceJob.create({
        data: {
          equipmentId: parsedJob.data.equipmentId,
          engineerUserId: session.id,
          jobType: parsedJob.data.jobType,
          status: "completed",
          description: parsedJob.data.description,
          startedAt: new Date(parsedJob.data.startedAt),
          completedAt: new Date(),
        },
      });
      newJobId = job.id;

      await recordAudit(tx, {
        entityType: "MaintenanceJob",
        entityId: job.id,
        action: "create",
        actorUserId: session.id,
        changes: parsedJob.data,
      });

      for (const row of partRows) {
        const item = await tx.inventoryItem.findUniqueOrThrow({
          where: { id: row.inventoryItemId },
        });

        if (Number(item.currentQuantity) < row.quantity) {
          throw new Error(
            `الكمية المتاحة من "${item.nameAr}" (${item.currentQuantity}) أقل من الكمية المطلوبة (${row.quantity})`
          );
        }

        await tx.inventoryItem.update({
          where: { id: row.inventoryItemId },
          data: { currentQuantity: { decrement: row.quantity } },
        });

        await tx.maintenanceJobItem.create({
          data: {
            maintenanceJobId: job.id,
            inventoryItemId: row.inventoryItemId,
            quantity: row.quantity,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            inventoryItemId: row.inventoryItemId,
            quantityChange: -row.quantity,
            movementType: "maintenance_out",
            referenceType: "MaintenanceJob",
            referenceId: job.id,
            destinationEquipmentId: parsedJob.data.equipmentId,
            performedByUserId: session.id,
          },
        });

        await recordAudit(tx, {
          entityType: "StockMovement",
          entityId: movement.id,
          action: "create",
          actorUserId: session.id,
          changes: row,
        });
      }

      for (const row of componentRows) {
        const now = new Date();
        const component = await tx.equipmentComponent.findUniqueOrThrow({
          where: { id: row.equipmentComponentId },
        });

        // استحقاق افتراضي: 90 يوم من تاريخ الصيانة دي — قابل للتعديل يدويًا
        // لاحقًا لو احتجنا قاعدة مختلفة لكل نوع قطعة.
        const nextDueAt = new Date(now);
        nextDueAt.setDate(nextDueAt.getDate() + 90);

        await tx.equipmentComponent.update({
          where: { id: component.id },
          data: { lastServiceAt: now, nextDueAt },
        });

        const event = await tx.componentServiceEvent.create({
          data: {
            maintenanceJobId: job.id,
            equipmentComponentId: component.id,
            eventType: row.eventType,
            performedAt: now,
          },
        });

        await recordAudit(tx, {
          entityType: "ComponentServiceEvent",
          entityId: event.id,
          action: "create",
          actorUserId: session.id,
          changes: row,
        });
      }
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "حصل خطأ أثناء تسجيل الصيانة",
    };
  }

  revalidatePath("/maintenance");
  revalidatePath(`/equipment/${parsedJob.data.equipmentId}`);
  revalidatePath("/equipment/inventory");
  redirect(`/maintenance/${newJobId}`);
}

const maintenanceJobUpdateSchema = z.object({
  jobId: z.string().min(1),
  jobType: z.enum(["routine", "repair", "emergency"]),
  startedAt: z.string().min(1, "تاريخ الصيانة مطلوب"),
  description: z.string().optional(),
});

// تعديل بيانات وصفية بس (النوع، التاريخ، الوصف) — مش بيلمس المعدة، المهندس،
// أو القطع/المواد المستهلكة، عشان دي أصلًا سبّبت حركات مخزون وأحداث صيانة
// اتسجلت فعلًا وقت الإنشاء؛ تعديلها بعد كده هيفصّل البيانات عن بعضها.
export async function updateMaintenanceJobAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.MAINTENANCE_CREATE);

  const parsed = maintenanceJobUpdateSchema.safeParse({
    jobId: formData.get("jobId"),
    jobType: formData.get("jobType"),
    startedAt: formData.get("startedAt"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { jobId, ...data } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const job = await tx.maintenanceJob.update({
      where: { id: jobId },
      data: { ...data, startedAt: new Date(data.startedAt) },
    });
    await recordAudit(tx, {
      entityType: "MaintenanceJob",
      entityId: job.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath(`/maintenance/${jobId}`);
  revalidatePath("/maintenance");
  redirect(`/maintenance/${jobId}`);
}

export async function archiveMaintenanceJobAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.MAINTENANCE_CREATE);
  const jobId = formData.get("jobId") as string;

  await prisma.$transaction(async (tx) => {
    const job = await tx.maintenanceJob.update({
      where: { id: jobId },
      data: { isActive: false },
    });
    await recordAudit(tx, {
      entityType: "MaintenanceJob",
      entityId: job.id,
      action: "update",
      actorUserId: session.id,
      changes: { isActive: false },
    });
  });

  revalidatePath("/maintenance");
  redirect("/maintenance");
}
