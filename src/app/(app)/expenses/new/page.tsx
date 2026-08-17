import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ExpenseForm } from "./expense-form";

export default async function NewExpensePage() {
  await requirePermission(PERMISSIONS.EXPENSES_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تسجيل مصروف</h1>
      <ExpenseForm />
    </div>
  );
}
