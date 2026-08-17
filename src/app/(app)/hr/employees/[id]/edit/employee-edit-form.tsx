"use client";

import { useActionState } from "react";
import { updateEmployeeAction } from "@/lib/actions/hr-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function EmployeeEditForm({
  employee,
}: {
  employee: {
    id: string;
    fullNameAr: string;
    position: string;
    hireDate: string;
    baseSalary: string;
    isActive: boolean;
  };
}) {
  const [state, action, pending] = useActionState(updateEmployeeAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="employeeId" value={employee.id} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullNameAr">الاسم بالكامل</Label>
            <Input id="fullNameAr" name="fullNameAr" defaultValue={employee.fullNameAr} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="position">الوظيفة</Label>
            <Input id="position" name="position" defaultValue={employee.position} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hireDate">تاريخ التعيين</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
                defaultValue={employee.hireDate}
                required
                className="ltr-technical"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="baseSalary">المرتب الأساسي</Label>
              <Input
                id="baseSalary"
                name="baseSalary"
                type="number"
                step="any"
                min="0"
                defaultValue={employee.baseSalary}
                required
                className="ltr-technical"
                dir="ltr"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={employee.isActive} className="size-4" />
            الموظف نشط
          </label>

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
