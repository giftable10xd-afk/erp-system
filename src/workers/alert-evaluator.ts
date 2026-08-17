import "dotenv/config";
import cron from "node-cron";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function notifyRole(
  roleKey: string,
  make: (recipientUserId: string) => { title: string; entityType: string; entityId: string; alertRuleId: string }
) {
  const recipients = await prisma.user.findMany({
    where: { isActive: true, roles: { some: { role: { key: roleKey } } } },
  });

  for (const recipient of recipients) {
    const payload = make(recipient.id);
    const existing = await prisma.notification.findFirst({
      where: {
        alertRuleId: payload.alertRuleId,
        entityId: payload.entityId,
        recipientUserId: recipient.id,
        isRead: false,
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        alertRuleId: payload.alertRuleId,
        recipientUserId: recipient.id,
        title: payload.title,
        entityType: payload.entityType,
        entityId: payload.entityId,
      },
    });
  }
}

export async function evaluateAlerts() {
  const rules = await prisma.alertRule.findMany({ where: { isActive: true } });
  const now = new Date();

  for (const rule of rules) {
    if (rule.entityType === "EquipmentComponent" && rule.conditionType === "date_due") {
      const thresholdDate = new Date(now);
      thresholdDate.setDate(thresholdDate.getDate() + (rule.thresholdDays ?? 7));

      const components = await prisma.equipmentComponent.findMany({
        where: { nextDueAt: { lte: thresholdDate, not: null } },
        include: { equipment: true },
      });

      for (const component of components) {
        await notifyRole(rule.notifyRoleKey, (recipientUserId) => ({
          alertRuleId: rule.id,
          recipientUserId,
          entityType: "EquipmentComponent",
          entityId: component.id,
          title: `${component.name} (${component.equipment.assetTag}) مستحق الصيانة قريبًا`,
        }));
      }
    }

    if (rule.entityType === "InventoryItem" && rule.conditionType === "quantity_below_min") {
      const items = await prisma.inventoryItem.findMany();
      const lowItems = items.filter(
        (item) => Number(item.currentQuantity) <= Number(item.reorderLevel)
      );

      for (const item of lowItems) {
        await notifyRole(rule.notifyRoleKey, (recipientUserId) => ({
          alertRuleId: rule.id,
          recipientUserId,
          entityType: "InventoryItem",
          entityId: item.id,
          title: `رصيد "${item.nameAr}" وصل للحد الأدنى (${item.currentQuantity} ${item.unit})`,
        }));
      }
    }

    if (rule.entityType === "RentalContract" && rule.conditionType === "overdue") {
      const overdueContracts = await prisma.rentalContract.findMany({
        where: { status: "active", expectedReturnDate: { lt: now } },
        include: { equipment: true, customer: true },
      });

      for (const contract of overdueContracts) {
        await notifyRole(rule.notifyRoleKey, (recipientUserId) => ({
          alertRuleId: rule.id,
          recipientUserId,
          entityType: "RentalContract",
          entityId: contract.id,
          title: `عقد إيجار ${contract.equipment.assetTag} (${contract.customer.nameAr}) اتأخر عن ميعاد التسليم`,
        }));
      }
    }
  }
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

if (isMainModule) {
  console.log("Alert evaluator worker started — running every 15 minutes.");
  evaluateAlerts().catch((e) => console.error("alert evaluation failed:", e));
  cron.schedule("*/15 * * * *", () => {
    evaluateAlerts().catch((e) => console.error("alert evaluation failed:", e));
  });
}
