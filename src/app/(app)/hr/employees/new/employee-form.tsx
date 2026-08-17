"use client";

import { useActionState } from "react";
import { createEmployeeAction } from "@/lib/actions/hr-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function EmployeeForm() {
  const [state, action, pending] = useActionState(createEmployeeAction, undefined);

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullNameAr">الاسم بالكامل</Label>
            <Input id="fullNameAr" name="fullNameAr" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="position">الوظيفة</Label>
            <Input id="position" name="position" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hireDate">تاريخ التعيين</Label>
              <Input
                id="hireDate"
                name="hireDate"
                type="date"
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
                required
                className="ltr-technical"
                dir="ltr"
              />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ الموظف"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
