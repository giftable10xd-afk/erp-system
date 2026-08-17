"use client";

import { useActionState } from "react";
import { updateTicketAction } from "@/lib/actions/support-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function TicketEditForm({
  ticket,
}: {
  ticket: { id: string; subject: string; priority: string };
}) {
  const [state, action, pending] = useActionState(updateTicketAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">عنوان الطلب</Label>
            <Input id="subject" name="subject" defaultValue={ticket.subject} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">الأولوية</Label>
            <select
              id="priority"
              name="priority"
              required
              defaultValue={ticket.priority}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="low">منخفضة</option>
              <option value="normal">عادية</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
