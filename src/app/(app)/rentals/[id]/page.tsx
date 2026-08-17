import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatDate, formatNumber } from "@/lib/format";
import { RENTAL_STATUS_CLASSES, RENTAL_STATUS_LABELS } from "@/lib/labels";
import { returnEquipmentAction, cancelRentalContractAction } from "@/lib/actions/rental-actions";

export default async function RentalContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.RENTALS_READ);
  const canWrite = session.permissions.has(PERMISSIONS.RENTALS_WRITE);
  const { id } = await params;

  const contract = await prisma.rentalContract.findUnique({
    where: { id },
    include: { customer: true, equipment: true },
  });

  if (!contract) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="ltr-technical">{contract.contractNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {contract.customer.nameAr} —{" "}
            <span className="ltr-technical">{contract.equipment.assetTag}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={RENTAL_STATUS_CLASSES[contract.status]}>
            {RENTAL_STATUS_LABELS[contract.status] ?? contract.status}
          </Badge>
          {canWrite && contract.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/rentals/${contract.id}/edit`}>تعديل</Link>}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">تاريخ الاستلام</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(contract.startDate)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">التسليم المتوقع</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(contract.expectedReturnDate)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">التسليم الفعلي</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(contract.actualReturnDate)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">قيمة الإيجار</CardTitle>
          </CardHeader>
          <CardContent>{formatNumber(contract.rateAmount.toString())}</CardContent>
        </Card>
      </div>

      {canWrite && contract.status === "active" && (
        <div className="flex flex-wrap gap-2">
          <form action={returnEquipmentAction} className="w-fit">
            <input type="hidden" name="contractId" value={contract.id} />
            <Button type="submit">تسجيل استلام المعدة (إنهاء العقد)</Button>
          </form>
          <form action={cancelRentalContractAction} className="w-fit">
            <input type="hidden" name="contractId" value={contract.id} />
            <ConfirmSubmitButton
              variant="destructive"
              confirmMessage="إلغاء عقد الإيجار ده؟ المعدة هترجع متاحة تاني."
            >
              إلغاء العقد
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
