import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmployeesTable } from "./employees-table";

export default async function HrPage() {
  const session = await requirePermission(PERMISSIONS.HR_READ);
  const canWrite = session.permissions.has(PERMISSIONS.HR_WRITE);

  const employees = await prisma.employee.findMany({
    orderBy: { fullNameAr: "asc" },
  });

  const rows = employees.map((emp) => ({
    id: emp.id,
    fullNameAr: emp.fullNameAr,
    position: emp.position,
    hireDateLabel: formatDate(emp.hireDate),
    baseSalaryLabel: formatCurrency(emp.baseSalary.toString()),
    isActive: emp.isActive,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users}
        title="الموارد البشرية"
        description="الموظفين والحضور والمرتبات"
        color="violet"
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/hr/attendance">الحضور اليومي</Link>} />
            <Button variant="outline" nativeButton={false} render={<Link href="/hr/payroll">المرتبات</Link>} />
            {canWrite && (
              <Button
                nativeButton={false}
                render={
                  <Link href="/hr/employees/new">
                    <Plus className="size-4" />
                    إضافة موظف
                  </Link>
                }
              />
            )}
          </>
        }
      />

      <EmployeesTable employees={rows} canWrite={canWrite} />
    </div>
  );
}
