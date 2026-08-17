import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { CustomerForm } from "./customer-form";

export default async function NewCustomerPage() {
  await requirePermission(PERMISSIONS.RENTALS_WRITE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة عميل</h1>
      <CustomerForm />
    </div>
  );
}
