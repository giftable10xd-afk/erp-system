import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MaintenanceJobEditForm } from "./maintenance-job-edit-form";

export default async function EditMaintenanceJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.MAINTENANCE_CREATE);
  const { id } = await params;

  const job = await prisma.maintenanceJob.findUnique({ where: { id } });
  if (!job) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">تعديل بيانات عملية الصيانة</h1>
      <MaintenanceJobEditForm
        job={{
          id: job.id,
          jobType: job.jobType,
          startedAt: job.startedAt.toISOString().slice(0, 10),
          description: job.description ?? "",
        }}
      />
    </div>
  );
}
