import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PAYROLL_STATUS_LABELS, monthNameAr } from "@/lib/labels";
import { finalizePayrollAction, voidPayrollRecordAction } from "@/lib/actions/hr-actions";
import { AdjustmentForm } from "./adjustment-form";
import { AdjustmentsList } from "./adjustments-list";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function PayrollRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.HR_READ);
  const canWrite = session.permissions.has(PERMISSIONS.HR_WRITE);
  const { id } = await params;

  const record = await prisma.payrollRecord.findUnique({
    where: { id },
    include: {
      employee: true,
      adjustments: { orderBy: { createdAt: "desc" }, include: { createdBy: true } },
    },
  });

  if (!record) notFound();

  const adjustmentRows = record.adjustments.map((a) => ({
    id: a.id,
    type: a.type,
    reason: a.reason,
    amount: formatNumber(a.amount.toString()),
    createdByName: a.createdBy.fullNameAr,
    createdAtLabel: formatDateTime(a.createdAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{record.employee.fullNameAr}</h1>
          <p className="text-sm text-muted-foreground">
            مرتب {monthNameAr(record.periodMonth)} {record.periodYear}
          </p>
        </div>
        <Badge variant="outline">{PAYROLL_STATUS_LABELS[record.status] ?? record.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">المرتب الأساسي</CardTitle>
          </CardHeader>
          <CardContent>{formatNumber(record.baseSalary.toString())}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي الخصومات</CardTitle>
          </CardHeader>
          <CardContent className="text-destructive">
            −{formatNumber(record.deductionsTotal.toString())}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي الإضافات</CardTitle>
          </CardHeader>
          <CardContent className="text-status-active">
            +{formatNumber(record.additionsTotal.toString())}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">الصافي</CardTitle>
          </CardHeader>
          <CardContent className="font-bold">{formatNumber(record.netPay.toString())}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الخصومات والإضافات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {adjustmentRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">مفيش خصومات أو إضافات مسجلة</p>
          ) : (
            <AdjustmentsList items={adjustmentRows} />
          )}
          {canWrite && record.status === "draft" && <AdjustmentForm payrollRecordId={record.id} />}
        </CardContent>
      </Card>

      {canWrite && record.status === "draft" && (
        <div className="flex flex-wrap gap-2">
          <form action={finalizePayrollAction} className="w-fit">
            <input type="hidden" name="payrollRecordId" value={record.id} />
            <Button type="submit">اعتماد المرتب</Button>
          </form>
          <form action={voidPayrollRecordAction} className="w-fit">
            <input type="hidden" name="payrollRecordId" value={record.id} />
            <ConfirmSubmitButton variant="destructive" confirmMessage="إلغاء سجل المرتب ده؟">
              إلغاء
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
