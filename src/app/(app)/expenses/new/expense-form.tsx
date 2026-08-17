"use client";

import { useActionState } from "react";
import { createExpenseAction } from "@/lib/actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ExpenseForm() {
  const [state, action, pending] = useActionState(createExpenseAction, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">الفئة</Label>
            <select
              id="category"
              name="category"
              required
              defaultValue="fuel"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="fuel">وقود</option>
              <option value="parts">قطع غيار</option>
              <option value="salaries">مرتبات</option>
              <option value="utilities">مرافق</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">الوصف</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="any"
                min="0"
                className="ltr-technical"
                dir="ltr"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expenseDate">التاريخ</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                defaultValue={today}
                className="ltr-technical"
                dir="ltr"
                required
              />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ المصروف"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
