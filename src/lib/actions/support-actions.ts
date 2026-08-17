"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

function generateTicketNumber() {
  return `TCK-${Date.now().toString(36).toUpperCase()}`;
}

const ticketSchema = z.object({
  subject: z.string().min(1, "عنوان الطلب مطلوب"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  customerId: z.string().optional(),
  equipmentId: z.string().optional(),
});

export async function createTicketAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.SUPPORT_WRITE);

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    priority: formData.get("priority"),
    customerId: formData.get("customerId") || undefined,
    equipmentId: formData.get("equipmentId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  let newId = "";
  await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        customerId: parsed.data.customerId,
        equipmentId: parsed.data.equipmentId,
        status: "open",
      },
    });
    newId = ticket.id;
    await recordAudit(tx, {
      entityType: "SupportTicket",
      entityId: ticket.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/support");
  redirect(`/support/${newId}`);
}

const commentSchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1, "اكتب تعليق قبل الإرسال"),
});

export async function addTicketCommentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.SUPPORT_WRITE);

  const parsed = commentSchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const comment = await tx.ticketComment.create({
      data: {
        ticketId: parsed.data.ticketId,
        authorUserId: session.id,
        body: parsed.data.body,
      },
    });
    await recordAudit(tx, {
      entityType: "TicketComment",
      entityId: comment.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath(`/support/${parsed.data.ticketId}`);
}

const ticketUpdateSchema = z.object({
  ticketId: z.string().min(1),
  subject: z.string().min(1, "عنوان الطلب مطلوب"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

export async function updateTicketAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.SUPPORT_WRITE);

  const parsed = ticketUpdateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    subject: formData.get("subject"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { ticketId, ...data } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.update({ where: { id: ticketId }, data });
    await recordAudit(tx, {
      entityType: "SupportTicket",
      entityId: ticket.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
  redirect(`/support/${ticketId}`);
}

export async function updateTicketStatusAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.SUPPORT_WRITE);
  const ticketId = formData.get("ticketId") as string;
  const status = formData.get("status") as string;

  await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
    await recordAudit(tx, {
      entityType: "SupportTicket",
      entityId: ticket.id,
      action: "update",
      actorUserId: session.id,
      changes: { status },
    });
  });

  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
}
