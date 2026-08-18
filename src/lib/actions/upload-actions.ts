"use server";

import { revalidatePath } from "next/cache";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { r2, R2_BUCKET } from "@/lib/r2";

export type UploadActionState = { error?: string; success?: boolean } | undefined;

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

export async function uploadLogoAction(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  const session = await requirePermission(PERMISSIONS.SETTINGS_WRITE);

  const file = formData.get("logoFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "لازم تختار ملف الشعار" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "حجم الملف أكبر من 2 ميجا" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "الملف لازم يكون صورة" };
  }

  const key = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const logoUrl = `/api/files/${key}`;

  await prisma.$transaction(async (tx) => {
    await tx.settings.upsert({
      where: { id: "default" },
      update: { logoUrl },
      create: { id: "default", logoUrl },
    });
    await recordAudit(tx, {
      entityType: "Settings",
      entityId: "default",
      action: "update",
      actorUserId: session.id,
      changes: { logoUrl: key },
    });
  });

  revalidatePath("/settings");
  return { success: true };
}
