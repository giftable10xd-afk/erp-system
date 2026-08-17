"use client";

import { useActionState } from "react";
import { createInventoryItemAction } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function InventoryItemForm() {
  const [state, action, pending] = useActionState(
    createInventoryItemAction,
    undefined
  );

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sku">الكود</Label>
            <Input id="sku" name="sku" required className="ltr-technical" dir="ltr" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nameAr">اسم الصنف</Label>
            <Input id="nameAr" name="nameAr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">وحدة القياس</Label>
              <Input id="unit" name="unit" placeholder="لتر / قطعة" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderLevel">حد إعادة الطلب</Label>
              <Input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                step="any"
                min="0"
                defaultValue="0"
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
            {pending ? "جارٍ الحفظ..." : "حفظ الصنف"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
