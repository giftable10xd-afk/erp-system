import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toggleUserActiveAction } from "@/lib/actions/user-actions";

export default async function UsersPage() {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    include: { roles: { include: { role: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ShieldCheck}
        title="المستخدمين والصلاحيات"
        description="إدارة حسابات الدخول والأدوار المرتبطة بيها"
        color="violet"
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/users/new">
                <Plus className="size-4" />
                إضافة مستخدم
              </Link>
            }
          />
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الأدوار</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="ltr-technical">{u.username}</TableCell>
                <TableCell>{u.fullNameAr}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((ur) => (
                      <Badge key={ur.roleId} variant="outline" className="bg-badge-4-bg text-badge-4">
                        {ur.role.nameAr}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      u.isActive
                        ? "bg-status-active-bg text-status-active"
                        : "bg-status-retired-bg text-status-retired"
                    }
                  >
                    {u.isActive ? "نشط" : "معطل"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/users/${u.id}/edit`}>تعديل</Link>}
                    />
                    {u.id !== session.id && (
                      <form action={toggleUserActiveAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="isActive" value={String(u.isActive)} />
                        <Button type="submit" variant="ghost" size="sm">
                          {u.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
