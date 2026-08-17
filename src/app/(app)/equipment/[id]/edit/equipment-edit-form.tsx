"use client";

import { useActionState } from "react";
import { updateEquipmentAction } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Equipment } from "@/generated/prisma/client";

const EQUIPMENT_TYPES = [
  { value: "generator", label: "مولد" },
  { value: "tractor", label: "تركتور" },
  { value: "other", label: "أخرى" },
];

const EQUIPMENT_STATUSES = [
  { value: "active", label: "نشطة" },
  { value: "in_maintenance", label: "تحت الصيانة" },
  { value: "rented", label: "مؤجرة" },
  { value: "retired", label: "خارج الخدمة" },
];

export function EquipmentEditForm({ equipment }: { equipment: Equipment }) {
  const [state, action, pending] = useActionState(updateEquipmentAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="equipmentId" value={equipment.id} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="assetTag">الرقم التعريفي</Label>
            <Input
              id="assetTag"
              name="assetTag"
              defaultValue={equipment.assetTag}
              required
              className="ltr-technical"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">النوع</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={equipment.type}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">الحالة</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={equipment.status}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {EQUIPMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">الماركة</Label>
              <Input id="brand" name="brand" defaultValue={equipment.brand ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">الموديل</Label>
              <Input id="model" name="model" defaultValue={equipment.model ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="serialNumber">الرقم المسلسل</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              defaultValue={equipment.serialNumber ?? ""}
              className="ltr-technical"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input id="notes" name="notes" defaultValue={equipment.notes ?? ""} />
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
