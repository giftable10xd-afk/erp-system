"use client";

import { useActionState } from "react";
import { createCustomerAction } from "@/lib/actions/rental-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomerAction, undefined);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nameAr">الاسم</Label>
            <Input id="nameAr" name="nameAr" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">النوع</Label>
            <select
              id="type"
              name="type"
              required
              defaultValue="individual"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="individual">فرد</option>
              <option value="company">شركة</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" name="phone" className="ltr-technical" dir="ltr" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taxId">الرقم الضريبي</Label>
              <Input id="taxId" name="taxId" className="ltr-technical" dir="ltr" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input id="email" name="email" type="email" className="ltr-technical" dir="ltr" />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ العميل"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
