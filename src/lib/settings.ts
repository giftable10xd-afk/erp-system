import "server-only";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  id: "default",
  companyNameAr: "نظام إدارة الشركة",
  taxId: null as string | null,
  address: null as string | null,
  phone: null as string | null,
  logoUrl: null as string | null,
  defaultTaxRate: 0,
};

/** بيرجع سجل الإعدادات الوحيد، أو قيم افتراضية لو لسه محدش عدّلها. */
export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!settings) return DEFAULT_SETTINGS;
  return { ...settings, defaultTaxRate: Number(settings.defaultTaxRate) };
}
