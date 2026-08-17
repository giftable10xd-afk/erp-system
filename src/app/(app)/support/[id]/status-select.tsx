"use client";

import { useTransition } from "react";
import { updateTicketStatusAction } from "@/lib/actions/support-actions";
import { TICKET_STATUS_LABELS } from "@/lib/labels";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export function StatusSelect({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("ticketId", ticketId);
        formData.set("status", e.target.value);
        startTransition(() => {
          updateTicketStatusAction(formData);
        });
      }}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {TICKET_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
