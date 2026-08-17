"use client";

import { useActionState, useMemo, useState } from "react";
import { createMaintenanceJobAction } from "@/lib/actions/maintenance-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type EquipmentOption = {
  id: string;
  assetTag: string;
  components: { id: string; name: string }[];
};

type InventoryOption = {
  id: string;
  nameAr: string;
  unit: string;
  currentQuantity: string;
};

const JOB_TYPES = [
  { value: "routine", label: "دورية" },
  { value: "repair", label: "إصلاح" },
  { value: "emergency", label: "طارئة" },
];

const COMPONENT_EVENT_TYPES = [
  { value: "changed", label: "اتغيرت" },
  { value: "inspected", label: "اتفحصت" },
  { value: "replaced", label: "اتستبدلت" },
];

function nowForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function MaintenanceJobForm({
  equipment,
  inventoryItems,
}: {
  equipment: EquipmentOption[];
  inventoryItems: InventoryOption[];
}) {
  const [state, action, pending] = useActionState(
    createMaintenanceJobAction,
    undefined
  );

  const [equipmentId, setEquipmentId] = useState(equipment[0]?.id ?? "");
  const [partRows, setPartRows] = useState<number[]>([0]);
  const [nextPartKey, setNextPartKey] = useState(1);
  const [componentRows, setComponentRows] = useState<number[]>([]);
  const [nextComponentKey, setNextComponentKey] = useState(0);

  const selectedEquipment = useMemo(
    () => equipment.find((e) => e.id === equipmentId),
    [equipment, equipmentId]
  );

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipmentId">المعدة</Label>
              <select
                id="equipmentId"
                name="equipmentId"
                required
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {equipment.length === 0 && <option value="">مفيش معدات مسجلة</option>}
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.assetTag}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobType">نوع الصيانة</Label>
              <select
                id="jobType"
                name="jobType"
                required
                defaultValue="routine"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="startedAt">تاريخ ووقت الصيانة</Label>
            <Input
              id="startedAt"
              name="startedAt"
              type="datetime-local"
              defaultValue={nowForInput()}
              required
              className="w-fit ltr-technical"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">وصف العملية</Label>
            <Input id="description" name="description" />
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>القطع/المواد المستهلكة من المخزون</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPartRows((rows) => [...rows, nextPartKey]);
                  setNextPartKey((k) => k + 1);
                }}
              >
                <Plus className="size-3.5" />
                إضافة صنف
              </Button>
            </div>
            {partRows.length === 0 && (
              <p className="text-sm text-muted-foreground">مفيش قطع مضافة</p>
            )}
            {partRows.map((rowKey) => (
              <div key={rowKey} className="flex items-center gap-2">
                <select
                  name="partInventoryItemId"
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                  defaultValue=""
                >
                  <option value="">— اختر صنف —</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr} (متاح: {item.currentQuantity} {item.unit})
                    </option>
                  ))}
                </select>
                <Input
                  name="partQuantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="الكمية"
                  className="ltr-technical w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="حذف الصف"
                  onClick={() => setPartRows((rows) => rows.filter((k) => k !== rowKey))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>الفلاتر/الزيوت/البخاخات اللي اتصانت في المعدة دي</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!selectedEquipment || selectedEquipment.components.length === 0}
                onClick={() => {
                  setComponentRows((rows) => [...rows, nextComponentKey]);
                  setNextComponentKey((k) => k + 1);
                }}
              >
                <Plus className="size-3.5" />
                إضافة قطعة
              </Button>
            </div>
            {(!selectedEquipment || selectedEquipment.components.length === 0) && (
              <p className="text-sm text-muted-foreground">
                المعدة دي مالهاش قطع مسجلة لسه (تقدر تضيفها من بروفايل المعدة)
              </p>
            )}
            {componentRows.map((rowKey) => (
              <div key={rowKey} className="flex items-center gap-2">
                <select
                  name="componentId"
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                  defaultValue=""
                >
                  <option value="">— اختر قطعة —</option>
                  {selectedEquipment?.components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  name="componentEventType"
                  className="h-9 w-32 rounded-md border border-input bg-transparent px-3 text-sm"
                  defaultValue="changed"
                >
                  {COMPONENT_EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="حذف الصف"
                  onClick={() =>
                    setComponentRows((rows) => rows.filter((k) => k !== rowKey))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "جارٍ التسجيل..." : "تسجيل الصيانة"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
