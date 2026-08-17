"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const employeeSchema = z.object({
  fullNameAr: z.string().min(1, "اسم الموظف مطلوب"),
  position: z.string().min(1, "الوظيفة مطلوبة"),
  hireDate: z.string().min(1, "تاريخ التعيين مطلوب"),
  baseSalary: z.coerce.number().min(0, "المرتب لازم يكون رقم صحيح"),
});

export async function createEmployeeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);

  const parsed = employeeSchema.safeParse({
    fullNameAr: formData.get("fullNameAr"),
    position: formData.get("position"),
    hireDate: formData.get("hireDate"),
    baseSalary: formData.get("baseSalary"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        fullNameAr: parsed.data.fullNameAr,
        position: parsed.data.position,
        hireDate: new Date(parsed.data.hireDate),
        baseSalary: parsed.data.baseSalary,
      },
    });
    await recordAudit(tx, {
      entityType: "Employee",
      entityId: employee.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath("/hr");
  redirect("/hr");
}

const employeeUpdateSchema = employeeSchema.extend({
  employeeId: z.string().min(1),
  isActive: z.coerce.boolean(),
});

export async function updateEmployeeAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);

  const parsed = employeeUpdateSchema.safeParse({
    employeeId: formData.get("employeeId"),
    fullNameAr: formData.get("fullNameAr"),
    position: formData.get("position"),
    hireDate: formData.get("hireDate"),
    baseSalary: formData.get("baseSalary"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  const { employeeId, ...data } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.update({
      where: { id: employeeId },
      data: { ...data, hireDate: new Date(data.hireDate) },
    });
    await recordAudit(tx, {
      entityType: "Employee",
      entityId: employee.id,
      action: "update",
      actorUserId: session.id,
      changes: data,
    });
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/employees/${employeeId}/edit`);
  redirect("/hr");
}

const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["present", "absent", "leave", "late"]),
});

export async function setAttendanceAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);

  const parsed = attendanceSchema.parse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    status: formData.get("status"),
  });

  const date = new Date(parsed.date);
  date.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const record = await tx.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: parsed.employeeId, date } },
      update: {
        status: parsed.status,
        checkIn: parsed.status === "present" || parsed.status === "late" ? new Date() : null,
      },
      create: {
        employeeId: parsed.employeeId,
        date,
        status: parsed.status,
        checkIn: parsed.status === "present" || parsed.status === "late" ? new Date() : null,
      },
    });
    await recordAudit(tx, {
      entityType: "AttendanceRecord",
      entityId: record.id,
      action: "update",
      actorUserId: session.id,
      changes: parsed,
    });
  });

  revalidatePath("/hr/attendance");
}

export async function generateMonthlyPayrollAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);
  const periodMonth = Number(formData.get("periodMonth"));
  const periodYear = Number(formData.get("periodYear"));

  const employees = await prisma.employee.findMany({ where: { isActive: true } });

  await prisma.$transaction(async (tx) => {
    for (const employee of employees) {
      const existing = await tx.payrollRecord.findUnique({
        where: {
          employeeId_periodMonth_periodYear: {
            employeeId: employee.id,
            periodMonth,
            periodYear,
          },
        },
      });
      if (existing) continue;

      const record = await tx.payrollRecord.create({
        data: {
          employeeId: employee.id,
          periodMonth,
          periodYear,
          baseSalary: employee.baseSalary,
          deductionsTotal: 0,
          additionsTotal: 0,
          netPay: employee.baseSalary,
          status: "draft",
        },
      });
      await recordAudit(tx, {
        entityType: "PayrollRecord",
        entityId: record.id,
        action: "create",
        actorUserId: session.id,
        changes: { periodMonth, periodYear },
      });
    }
  });

  revalidatePath("/hr/payroll");
}

const adjustmentSchema = z.object({
  payrollRecordId: z.string().min(1),
  type: z.enum(["deduction", "addition"]),
  reason: z.string().min(1, "السبب مطلوب"),
  amount: z.coerce.number().positive("المبلغ لازم يكون أكبر من صفر"),
});

export async function addPayrollAdjustmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);

  const parsed = adjustmentSchema.safeParse({
    payrollRecordId: formData.get("payrollRecordId"),
    type: formData.get("type"),
    reason: formData.get("reason"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };
  }

  await prisma.$transaction(async (tx) => {
    const record = await tx.payrollRecord.findUniqueOrThrow({
      where: { id: parsed.data.payrollRecordId },
    });

    const adjustment = await tx.payrollAdjustment.create({
      data: {
        payrollRecordId: record.id,
        type: parsed.data.type,
        reason: parsed.data.reason,
        amount: parsed.data.amount,
        createdByUserId: session.id,
      },
    });

    const newDeductionsTotal =
      parsed.data.type === "deduction"
        ? Number(record.deductionsTotal) + parsed.data.amount
        : Number(record.deductionsTotal);
    const newAdditionsTotal =
      parsed.data.type === "addition"
        ? Number(record.additionsTotal) + parsed.data.amount
        : Number(record.additionsTotal);

    await tx.payrollRecord.update({
      where: { id: record.id },
      data: {
        deductionsTotal: newDeductionsTotal,
        additionsTotal: newAdditionsTotal,
        netPay: Number(record.baseSalary) - newDeductionsTotal + newAdditionsTotal,
      },
    });

    await recordAudit(tx, {
      entityType: "PayrollAdjustment",
      entityId: adjustment.id,
      action: "create",
      actorUserId: session.id,
      changes: parsed.data,
    });
  });

  revalidatePath(`/hr/payroll/${parsed.data.payrollRecordId}`);
}

export async function finalizePayrollAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);
  const payrollRecordId = formData.get("payrollRecordId") as string;

  await prisma.$transaction(async (tx) => {
    const record = await tx.payrollRecord.update({
      where: { id: payrollRecordId },
      data: { status: "finalized" },
    });
    await recordAudit(tx, {
      entityType: "PayrollRecord",
      entityId: record.id,
      action: "update",
      actorUserId: session.id,
      changes: { status: "finalized" },
    });
  });

  revalidatePath(`/hr/payroll/${payrollRecordId}`);
}

export async function voidPayrollRecordAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.HR_WRITE);
  const payrollRecordId = formData.get("payrollRecordId") as string;

  await prisma.$transaction(async (tx) => {
    const record = await tx.payrollRecord.update({
      where: { id: payrollRecordId },
      data: { status: "void" },
    });
    await recordAudit(tx, {
      entityType: "PayrollRecord",
      entityId: record.id,
      action: "update",
      actorUserId: session.id,
      changes: { status: "void" },
    });
  });

  revalidatePath(`/hr/payroll/${payrollRecordId}`);
  revalidatePath("/hr/payroll");
}
