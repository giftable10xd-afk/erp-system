"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const expenseSchema = z.object({
  category: z.enum(["fuel", "parts", "salaries", "utilities", "other"]),
  description: z.string().min(1, "الوصف مطلوب"),
  amount: z.coerce.number().positive("المبلغ لازم يكون أكبر من صفر"),
  expenseDate: z.string().min(1, "التاريخ مطلوب"),
});

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.EXPENSES_WRITE);

  const parsed = expenseSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        category: parsed.data.category,
        description: parsed.data.description,
        amount: parsed.data.amount,
        expenseDate: new Date(parsed.data.expenseDate),
        recordedByUserId: session.id,
      },
    });
    await recordAudit(tx, {
      entityType: "Expense",
      entityId: expense.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/expenses");
  redirect("/expenses");
}
