import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notification-actions";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default async function NotificationsPage() {
  const session = await requirePermission(PERMISSIONS.ALERTS_READ);

  const notifications = await prisma.notification.findMany({
    where: { recipientUserId: session.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Bell}
        title="التنبيهات"
        description="تنبيهات تلقائية زي استحقاق صيانة قريب أو رصيد مخزون منخفض"
        color="pink"
        actions={
          unreadCount > 0 && (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline">
                تعليم الكل كمقروء
              </Button>
            </form>
          )
        }
      />

      <div className="flex flex-col gap-3">
        {notifications.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              مفيش تنبيهات لسه
            </CardContent>
          </Card>
        )}
        {notifications.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-60" : "border-primary/40"}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={n.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    تعليم كمقروء
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
