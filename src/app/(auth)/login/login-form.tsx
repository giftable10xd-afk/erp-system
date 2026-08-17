"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <Card className="border-0 shadow-2xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
