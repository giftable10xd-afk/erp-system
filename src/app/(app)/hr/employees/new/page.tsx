import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { EmployeeForm } from "./employee-form";

export default async function NewEmployeePage() {
  await requirePermission(PERMISSIONS.HR_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة موظف</h1>
      <EmployeeForm />
    </div>
  );
}
