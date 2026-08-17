"use client";

import { useActionState } from "react";
import { createTicketAction } from "@/lib/actions/support-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function TicketForm({
  customers,
  equipment,
}: {
  customers: { id: string; nameAr: string }[];
  equipment: { id: string; assetTag: string }[];
}) {
  const [state, action, pending] = useActionState(createTicketAction, undefined);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">الموضوع</Label>
            <Input id="subject" name="subject" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">الأولوية</Label>
            <select
              id="priority"
              name="priority"
              defaultValue="normal"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="low">منخفضة</option>
              <option value="normal">عادية</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customerId">العميل (اختياري)</Label>
            <select
              id="customerId"
              name="customerId"
              defaultValue=""
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">بدون</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="equipmentId">المعدة (اختياري)</Label>
            <select
              id="equipmentId"
              name="equipmentId"
              defaultValue=""
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">بدون</option>
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.assetTag}
                </option>
              ))}
            </select>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "إنشاء الطلب"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
