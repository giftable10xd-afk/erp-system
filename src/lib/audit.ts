import "server-only";
import type { Prisma } from "@/generated/prisma/client";

type AuditableClient = Prisma.TransactionClient;

/**
 * يُستدعى دايمًا جوه نفس المعاملة (transaction) بتاعة أي عملية تعديل بيانات،
 * مش كخطوة منفصلة بعدها — عشان سجل الـ audit يتضمن أو يترجع مع باقي التغييرات.
 */
export async function recordAudit(
  tx: AuditableClient,
  params: {
    entityType: string;
    entityId: string;
    action: "create" | "update" | "delete";
    actorUserId: string;
    changes?: Record<string, unknown>;
  }
) {
  await tx.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorUserId: params.actorUserId,
      changes: params.changes as Prisma.InputJsonValue | undefined,
    },
  });
}
