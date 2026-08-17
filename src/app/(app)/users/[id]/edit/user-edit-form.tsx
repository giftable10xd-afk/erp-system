"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/lib/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function UserEditForm({ user }: { user: { id: string; fullNameAr: string } }) {
  const [state, action, pending] = useActionState(updateUserAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullNameAr">الاسم</Label>
            <Input id="fullNameAr" name="fullNameAr" defaultValue={user.fullNameAr} required />
          </div>
          <p className="text-xs text-muted-foreground">
            اسم المستخدم وكلمة المرور مش قابلين للتعديل من هنا — للحفاظ على سجل التدقيق.
          </p>
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
