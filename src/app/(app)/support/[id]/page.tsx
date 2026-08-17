import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import {
  TICKET_PRIORITY_CLASSES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_CLASSES,
  TICKET_STATUS_LABELS,
} from "@/lib/labels";
import { CommentForm } from "./comment-form";
import { StatusSelect } from "./status-select";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.SUPPORT_READ);
  const canWrite = session.permissions.has(PERMISSIONS.SUPPORT_WRITE);
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: true,
      equipment: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="ltr-technical">{ticket.ticketNumber}</span>
            {ticket.customer && ` — ${ticket.customer.nameAr}`}
            {ticket.equipment && (
              <>
                {" — "}
                <span className="ltr-technical">{ticket.equipment.assetTag}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/support/${ticket.id}/edit`}>تعديل</Link>}
            />
          )}
          <Badge variant="outline" className={TICKET_PRIORITY_CLASSES[ticket.priority]}>
            {TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
          </Badge>
          {canWrite ? (
            <StatusSelect ticketId={ticket.id} currentStatus={ticket.status} />
          ) : (
            <Badge variant="outline" className={TICKET_STATUS_CLASSES[ticket.status]}>
              {TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المتابعة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {ticket.comments.length === 0 && (
            <p className="text-sm text-muted-foreground">مفيش تعليقات لسه</p>
          )}
          <div className="flex flex-col gap-3">
            {ticket.comments.map((c) => (
              <div key={c.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{c.author.fullNameAr}</span>
                  <span>{formatDateTime(c.createdAt)}</span>
                </div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
          {canWrite && <CommentForm ticketId={ticket.id} />}
        </CardContent>
      </Card>
    </div>
  );
}
