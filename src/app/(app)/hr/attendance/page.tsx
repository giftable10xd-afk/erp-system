import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { AttendanceRow } from "./attendance-row";

export default async function AttendancePage() {
  const session = await requirePermission(PERMISSIONS.HR_READ);
  const canWrite = session.permissions.has(PERMISSIONS.HR_WRITE);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { fullNameAr: "asc" },
    include: {
      attendance: {
        where: { date: today },
        take: 1,
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">الحضور اليومي</h1>
        <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col divide-y pt-6">
          {employees.length === 0 && (
            <p className="text-sm text-muted-foreground">مفيش موظفين نشطين</p>
          )}
          {employees.map((emp) => (
            <AttendanceRow
              key={emp.id}
              employeeId={emp.id}
              employeeName={emp.fullNameAr}
              date={today.toISOString()}
              currentStatus={emp.attendance[0]?.status ?? null}
              readOnly={!canWrite}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
