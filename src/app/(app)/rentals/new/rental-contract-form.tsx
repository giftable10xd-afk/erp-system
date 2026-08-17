"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createRentalContractAction } from "@/lib/actions/rental-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RentalContractForm({
  customers,
  equipment,
  defaultCustomerId,
}: {
  customers: { id: string; nameAr: string }[];
  equipment: { id: string; assetTag: string }[];
  defaultCustomerId?: string;
}) {
  const [state, action, pending] = useActionState(createRentalContractAction, undefined);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerId">العميل</Label>
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                مفيش عملاء مسجلين —{" "}
                <Link href="/rentals/customers/new" className="text-primary hover:underline">
                  أضف عميل الأول
                </Link>
              </p>
            ) : (
              <select
                id="customerId"
                name="customerId"
                required
                defaultValue={defaultCustomerId ?? ""}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="" disabled>
                  اختر العميل
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="equipmentId">المعدة</Label>
            {equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">مفيش معدات متاحة للإيجار دلوقتي</p>
            ) : (
              <select
                id="equipmentId"
                name="equipmentId"
                required
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  اختر المعدة
                </option>
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.assetTag}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">تاريخ الاستلام</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                required
                className="ltr-technical"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expectedReturnDate">تاريخ التسليم المتوقع</Label>
              <Input
                id="expectedReturnDate"
                name="expectedReturnDate"
                type="date"
                required
                className="ltr-technical"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rateAmount">قيمة الإيجار</Label>
            <Input
              id="rateAmount"
              name="rateAmount"
              type="number"
              step="any"
              min="0"
              required
              className="ltr-technical w-40"
              dir="ltr"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending || customers.length === 0 || equipment.length === 0}
            className="mt-2 w-fit"
          >
            {pending ? "جارٍ الحفظ..." : "إنشاء العقد"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
