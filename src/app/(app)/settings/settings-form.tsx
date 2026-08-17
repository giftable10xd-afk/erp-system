"use client";

import { useActionState } from "react";
import { upsertSettingsAction } from "@/lib/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsForm({
  settings,
}: {
  settings: {
    companyNameAr: string;
    taxId: string | null;
    address: string | null;
    phone: string | null;
    logoUrl: string | null;
    defaultTaxRate: number;
  };
}) {
  const [state, action, pending] = useActionState(upsertSettingsAction, undefined);

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="companyNameAr">اسم الشركة</Label>
            <Input
              id="companyNameAr"
              name="companyNameAr"
              defaultValue={settings.companyNameAr}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="taxId">الرقم الضريبي</Label>
            <Input
              id="taxId"
              name="taxId"
              defaultValue={settings.taxId ?? ""}
              className="ltr-technical"
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">العنوان</Label>
            <Input id="address" name="address" defaultValue={settings.address ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={settings.phone ?? ""}
              className="ltr-technical"
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="logoUrl">رابط الشعار (اختياري)</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={settings.logoUrl ?? ""}
              className="ltr-technical"
              dir="ltr"
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultTaxRate">نسبة الضريبة الافتراضية %</Label>
            <Input
              id="defaultTaxRate"
              name="defaultTaxRate"
              type="number"
              step="any"
              min="0"
              max="100"
              defaultValue={settings.defaultTaxRate}
              className="ltr-technical w-32"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          {state?.success && <p className="text-sm text-status-active">تم الحفظ</p>}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
