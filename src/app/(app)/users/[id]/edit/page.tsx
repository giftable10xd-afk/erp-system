import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { UserEditForm } from "./user-edit-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.USERS_MANAGE);
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        تعديل <span className="ltr-technical">{user.username}</span>
      </h1>
      <UserEditForm user={{ id: user.id, fullNameAr: user.fullNameAr }} />
    </div>
  );
}
