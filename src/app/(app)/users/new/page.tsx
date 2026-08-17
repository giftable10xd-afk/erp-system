import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserForm } from "./user-form";

export default async function NewUserPage() {
  await requirePermission(PERMISSIONS.USERS_MANAGE);

  const roles = await prisma.role.findMany({ orderBy: { nameAr: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">إضافة مستخدم</h1>
      <UserForm roles={roles.map((r) => ({ id: r.id, nameAr: r.nameAr, key: r.key }))} />
    </div>
  );
}
