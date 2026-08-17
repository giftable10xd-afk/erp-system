"use client";

import { useActionState } from "react";
import { createEquipmentAction } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const EQUIPMENT_TYPES = [
  { value: "generator", label: "مولد" },
  { value: "tractor", label: "تركتور" },
  { value: "other", label: "أخرى" },
];

export function EquipmentForm() {
  const [state, action, pending] = useActionState(createEquipmentAction, undefined);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assetTag">الرقم التعريفي</Label>
            <Input id="assetTag" name="assetTag" required className="ltr-technical" dir="ltr" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">النوع</Label>
            <select
              id="type"
              name="type"
              required
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                اختر النوع
              </option>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">الماركة</Label>
              <Input id="brand" name="brand" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">الموديل</Label>
              <Input id="model" name="model" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="serialNumber">الرقم المسلسل</Label>
            <Input id="serialNumber" name="serialNumber" className="ltr-technical" dir="ltr" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input id="notes" name="notes" />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ المعدة"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
