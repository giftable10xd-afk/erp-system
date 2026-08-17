import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EmployeeEditForm } from "./employee-edit-form";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.HR_WRITE);
  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل بيانات {employee.fullNameAr}</h1>
      <EmployeeEditForm
        employee={{
          id: employee.id,
          fullNameAr: employee.fullNameAr,
          position: employee.position,
          hireDate: employee.hireDate.toISOString().slice(0, 10),
          baseSalary: employee.baseSalary.toString(),
          isActive: employee.isActive,
        }}
      />
    </div>
  );
}
