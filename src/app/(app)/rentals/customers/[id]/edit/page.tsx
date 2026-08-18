import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CustomerEditForm } from "./customer-edit-form";
import { PortalLinkBox } from "@/components/portal-link-box";
import { Label } from "@/components/ui/label";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.RENTALS_WRITE);
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل {customer.nameAr}</h1>
      <CustomerEditForm
        customer={{
          id: customer.id,
          nameAr: customer.nameAr,
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          taxId: customer.taxId ?? "",
          type: customer.type,
        }}
      />
      <div className="flex max-w-xl flex-col gap-2">
        <Label>رابط بوابة العميل</Label>
        <PortalLinkBox path={`/portal/${customer.portalToken}`} />
        <p className="text-xs text-muted-foreground">
          ابعت الرابط ده للعميل — يقدر يشوف فواتيره وعروض أسعاره من غيره تسجيل دخول.
        </p>
      </div>
    </div>
  );
}
