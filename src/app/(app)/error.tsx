"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({ error }: { error: Error }) {
  const isUnauthorized = error.name === "UnauthorizedError";

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{isUnauthorized ? "غير مصرح" : "حدث خطأ"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isUnauthorized
            ? "مالكش صلاحية الوصول لهذه الصفحة. تواصل مع المالك لو محتاج صلاحية إضافية."
            : "حصل خطأ غير متوقع. جرّب تاني أو ارجع للوحة التحكم."}
        </CardContent>
      </Card>
    </div>
  );
}
