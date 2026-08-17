"use client";

import { useActionState } from "react";
import { createUserAction } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function UserForm({ roles }: { roles: { id: string; nameAr: string; key: string }[] }) {
  const [state, action, pending] = useActionState(createUserAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullNameAr">الاسم بالكامل</Label>
            <Input id="fullNameAr" name="fullNameAr" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" name="username" required className="ltr-technical" dir="ltr" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="ltr-technical"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>الأدوار</Label>
            <div className="flex flex-col gap-2 rounded-md border p-3">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="roleIds" value={role.id} className="size-4" />
                  {role.nameAr}
                </label>
              ))}
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "إنشاء المستخدم"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
