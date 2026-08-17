"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function markNotificationReadAction(formData: FormData) {
  const session = await requireSession();
  const notificationId = formData.get("notificationId") as string;

  await prisma.notification.updateMany({
    where: { id: notificationId, recipientUserId: session.id },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession();

  await prisma.notification.updateMany({
    where: { recipientUserId: session.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");
}
