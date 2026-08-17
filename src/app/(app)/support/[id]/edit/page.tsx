import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { TicketEditForm } from "./ticket-edit-form";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.SUPPORT_WRITE);
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل طلب الدعم</h1>
      <TicketEditForm ticket={{ id: ticket.id, subject: ticket.subject, priority: ticket.priority }} />
    </div>
  );
}
