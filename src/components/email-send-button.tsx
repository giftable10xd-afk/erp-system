"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import type { EmailActionState } from "@/lib/actions/email-actions";

export function EmailSendButton({
  action,
  hiddenFieldName,
  hiddenFieldValue,
  customerHasEmail,
}: {
  action: (state: EmailActionState, formData: FormData) => Promise<EmailActionState>;
  hiddenFieldName: string;
  hiddenFieldValue: string;
  customerHasEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  if (!customerHasEmail) {
    return (
      <p className="text-xs text-muted-foreground">
        العميل ده مفيهوش بريد إلكتروني مسجل — أضفه من صفحة العميل عشان تقدر تبعتله
      </p>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <Mail className="size-3.5" />
        {pending ? "جارٍ الإرسال..." : "إرسال بالبريد للعميل"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
      {state?.success && <span className="text-sm text-status-active">تم الإرسال</span>}
    </form>
  );
}
