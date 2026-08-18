"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string; success?: boolean } | undefined;

// logoUrl مش موجود هنا عمدًا — بيتحدث لوحده من uploadLogoAction (رفع
// ملف حقيقي لـ R2)، مش من الفورم ده.
const settingsSchema = z.object({
  companyNameAr: z.string().min(1, "اسم الشركة مطلوب"),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100),
});

export async function upsertSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.SETTINGS_WRITE);

  const parsed = settingsSchema.safeParse({
    companyNameAr: formData.get("companyNameAr"),
    taxId: formData.get("taxId") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    defaultTaxRate: formData.get("defaultTaxRate") || "0",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.settings.upsert({
      where: { id: "default" },
      update: parsed.data,
      create: { id: "default", ...parsed.data },
    });

    await recordAudit(tx, {
      entityType: "Settings",
      entityId: "default",
      action: "update",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/settings");
  return { success: true };
}
