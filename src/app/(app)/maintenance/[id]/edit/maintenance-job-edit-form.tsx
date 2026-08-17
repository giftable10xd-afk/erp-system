"use client";

import { useActionState } from "react";
import { updateMaintenanceJobAction } from "@/lib/actions/maintenance-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function MaintenanceJobEditForm({
  job,
}: {
  job: { id: string; jobType: string; startedAt: string; description: string };
}) {
  const [state, action, pending] = useActionState(updateMaintenanceJobAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="jobId" value={job.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="jobType">النوع</Label>
            <select
              id="jobType"
              name="jobType"
              required
              defaultValue={job.jobType}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="routine">دورية</option>
              <option value="repair">إصلاح</option>
              <option value="emergency">طارئة</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="startedAt">تاريخ الصيانة</Label>
            <Input
              id="startedAt"
              name="startedAt"
              type="date"
              defaultValue={job.startedAt}
              className="ltr-technical"
              dir="ltr"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">وصف العملية</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={job.description}
              rows={4}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
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
