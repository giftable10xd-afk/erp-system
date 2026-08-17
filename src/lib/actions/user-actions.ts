"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const createUserSchema = z.object({
  username: z.string().min(3, "اسم المستخدم لازم يكون ٣ حروف على الأقل"),
  password: z.string().min(8, "كلمة المرور لازم تكون ٨ حروف على الأقل"),
  fullNameAr: z.string().min(1, "الاسم مطلوب"),
});

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = createUserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    fullNameAr: formData.get("fullNameAr"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const roleIds = formData.getAll("roleIds") as string[];
  if (roleIds.length === 0) {
    return { error: "لازم تختار دور واحد على الأقل" };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "اسم المستخدم ده مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: parsed.data.username,
        passwordHash,
        fullNameAr: parsed.data.fullNameAr,
        isActive: true,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
    });
    await recordAudit(tx, {
      entityType: "User",
      entityId: user.id,
      action: "create",
      actorUserId: session.id,
      changes: { username: parsed.data.username, roleIds },
    });
  });

  revalidatePath("/users");
  redirect("/users");
}

const userUpdateSchema = z.object({
  userId: z.string().min(1),
  fullNameAr: z.string().min(1, "الاسم مطلوب"),
});

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = userUpdateSchema.safeParse({
    userId: formData.get("userId"),
    fullNameAr: formData.get("fullNameAr"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: parsed.data.userId },
      data: { fullNameAr: parsed.data.fullNameAr },
    });
    await recordAudit(tx, {
      entityType: "User",
      entityId: user.id,
      action: "update",
      actorUserId: session.id,
      changes: { fullNameAr: parsed.data.fullNameAr },
    });
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUserActiveAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const userId = formData.get("userId") as string;
  const isActive = formData.get("isActive") === "true";

  if (userId === session.id) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isActive: !isActive },
    });
    await recordAudit(tx, {
      entityType: "User",
      entityId: user.id,
      action: "update",
      actorUserId: session.id,
      changes: { isActive: !isActive },
    });
  });

  revalidatePath("/users");
}
