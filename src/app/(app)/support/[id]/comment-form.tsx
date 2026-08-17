"use client";

import { useActionState, useRef, useEffect } from "react";
import { addTicketCommentAction } from "@/lib/actions/support-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommentForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(addTicketCommentAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="flex items-end gap-2 border-t pt-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Input name="body" placeholder="اكتب تعليق..." className="flex-1" required />
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "إرسال"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  );
}
