"use client";

import { useActionState } from "react";
import { recordPaymentAction } from "@/lib/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, action, pending] = useActionState(recordPaymentAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t pt-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">المبلغ</label>
        <Input
          name="amount"
          type="number"
          step="any"
          min="0"
          required
          className="ltr-technical w-28"
          dir="ltr"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">طريقة الدفع</label>
        <select
          name="method"
          defaultValue="cash"
          className="h-9 w-36 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="cash">نقدًا</option>
          <option value="bank_transfer">تحويل بنكي</option>
          <option value="check">شيك</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "تسجيل الدفعة"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  );
}
