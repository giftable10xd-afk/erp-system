"use client";

import { useActionState } from "react";
import { addPayrollAdjustmentAction } from "@/lib/actions/hr-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdjustmentForm({ payrollRecordId }: { payrollRecordId: string }) {
  const [state, action, pending] = useActionState(addPayrollAdjustmentAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2 border-t pt-4">
      <input type="hidden" name="payrollRecordId" value={payrollRecordId} />
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">النوع</label>
        <select
          name="type"
          defaultValue="deduction"
          className="h-9 w-32 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="deduction">خصم</option>
          <option value="addition">إضافة/مكافأة</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted-foreground">السبب</label>
        <Input name="reason" required className="w-48" />
      </div>
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
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "إضافة"}
      </Button>
      {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
    </form>
  );
}
