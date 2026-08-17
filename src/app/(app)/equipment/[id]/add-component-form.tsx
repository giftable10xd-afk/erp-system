"use client";

import { useActionState } from "react";
import { addEquipmentComponentAction } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COMPONENT_TYPES = [
  { value: "filter", label: "فلتر" },
  { value: "oil", label: "زيت" },
  { value: "injector", label: "بخاخ/حاقن" },
  { value: "other_part", label: "قطعة غيار أخرى" },
];

export function AddComponentForm({ equipmentId }: { equipmentId: string }) {
  const [state, action, pending] = useActionState(
    addEquipmentComponentAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 border-t pt-4">
      <input type="hidden" name="equipmentId" value={equipmentId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="componentType">النوع</Label>
        <select
          id="componentType"
          name="componentType"
          required
          className="h-9 w-40 rounded-md border border-input bg-transparent px-3 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            اختر
          </option>
          {COMPONENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">الاسم</Label>
        <Input id="name" name="name" required className="w-48" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="installedAt">تاريخ التركيب</Label>
        <Input id="installedAt" name="installedAt" type="date" className="w-40" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nextDueAt">الاستحقاق القادم</Label>
        <Input id="nextDueAt" name="nextDueAt" type="date" className="w-40" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "جارٍ الإضافة..." : "إضافة"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
