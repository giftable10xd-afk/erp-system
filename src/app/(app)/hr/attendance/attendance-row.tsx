"use client";

import { useTransition } from "react";
import { setAttendanceAction } from "@/lib/actions/hr-actions";
import { Badge } from "@/components/ui/badge";
import { ATTENDANCE_STATUS_CLASSES, ATTENDANCE_STATUS_LABELS } from "@/lib/labels";

const STATUSES = ["present", "late", "leave", "absent"] as const;

export function AttendanceRow({
  employeeId,
  employeeName,
  date,
  currentStatus,
  readOnly,
}: {
  employeeId: string;
  employeeName: string;
  date: string;
  currentStatus: string | null;
  readOnly: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-medium">{employeeName}</span>
        {currentStatus && (
          <Badge variant="outline" className={ATTENDANCE_STATUS_CLASSES[currentStatus]}>
            {ATTENDANCE_STATUS_LABELS[currentStatus]}
          </Badge>
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-1">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => {
                const formData = new FormData();
                formData.set("employeeId", employeeId);
                formData.set("date", date);
                formData.set("status", status);
                startTransition(() => {
                  setAttendanceAction(formData);
                });
              }}
              className={`cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50 ${
                currentStatus === status ? "border-primary bg-primary/10 text-primary" : "border-input"
              }`}
            >
              {ATTENDANCE_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
