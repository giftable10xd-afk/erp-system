"use client";

import { useActionState } from "react";
import { updateCustomerAction } from "@/lib/actions/rental-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function CustomerEditForm({
  customer,
}: {
  customer: {
    id: string;
    nameAr: string;
    phone: string;
    email: string;
    taxId: string;
    type: string;
  };
}) {
  const [state, action, pending] = useActionState(updateCustomerAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="customerId" value={customer.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="nameAr">الاسم</Label>
            <Input id="nameAr" name="nameAr" defaultValue={customer.nameAr} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">النوع</Label>
            <select
              id="type"
              name="type"
              required
              defaultValue={customer.type}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="individual">فرد</option>
              <option value="company">شركة</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={customer.phone}
                className="ltr-technical"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taxId">الرقم الضريبي</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={customer.taxId}
                className="ltr-technical"
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={customer.email}
              className="ltr-technical"
              dir="ltr"
            />
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
