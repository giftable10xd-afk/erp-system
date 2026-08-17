import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Users2 } from "lucide-react";
import { CUSTOMER_TYPE_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { archiveCustomerAction } from "@/lib/actions/rental-actions";

export default async function CustomersPage() {
  const session = await requirePermission(PERMISSIONS.RENTALS_READ);
  const canWrite = session.permissions.has(PERMISSIONS.RENTALS_WRITE);

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { nameAr: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Users2}
        title="العملاء"
        description="عملاء الإيجارات والفوترة"
        color="pink"
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/rentals">العقود</Link>} />
            {canWrite && (
              <Button
                nativeButton={false}
                render={
                  <Link href="/rentals/customers/new">
                    <Plus className="size-4" />
                    إضافة عميل
                  </Link>
                }
              />
            )}
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الرقم الضريبي</TableHead>
              {canWrite && <TableHead>إجراء</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-center text-muted-foreground">
                  مفيش عملاء مسجلين لسه
                </TableCell>
              </TableRow>
            )}
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nameAr}</TableCell>
                <TableCell>{CUSTOMER_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                <TableCell className="ltr-technical">{c.phone || "—"}</TableCell>
                <TableCell className="ltr-technical">{c.taxId || "—"}</TableCell>
                {canWrite && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link href={`/rentals/customers/${c.id}/edit`}>
                            <Pencil className="size-3.5" />
                            تعديل
                          </Link>
                        }
                      />
                      <form action={archiveCustomerAction}>
                        <input type="hidden" name="customerId" value={c.id} />
                        <ConfirmSubmitButton
                          variant="ghost"
                          size="sm"
                          confirmMessage={`أرشفة "${c.nameAr}"؟ هيختفي من قائمة العملاء بس سجله وفواتيره هتفضل محفوظة.`}
                        >
                          أرشفة
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
