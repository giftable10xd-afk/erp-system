import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PERMISSIONS, ROLE_SEEDS } from "../src/lib/permissions";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // كل مفاتيح الصلاحيات
  for (const key of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, nameAr: key },
    });
  }

  // الأدوار الأولية وربطها بالصلاحيات
  for (const roleSeed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: { key: roleSeed.key },
      update: { nameAr: roleSeed.nameAr, description: roleSeed.description },
      create: {
        key: roleSeed.key,
        nameAr: roleSeed.nameAr,
        description: roleSeed.description,
      },
    });

    for (const permissionKey of roleSeed.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // مستخدم المالك الافتراضي (لازم يتغير الباسورد فورًا بعد أول دخول)
  const ownerPasswordHash = await hash("ChangeMe123!");
  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      passwordHash: ownerPasswordHash,
      fullNameAr: "المالك",
      isActive: true,
    },
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { key: "owner" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: owner.id, roleId: ownerRole.id },
  });

  // قواعد التنبيهات الأولية — كل حالة بتتبعت لصاحب العلاقة المباشر وللمالك
  // كمان (المالك يشوف كل حاجة، مطابق لمبدأ "لوحة تحكم المالك" في المواصفات)
  const alertRuleSeeds = [
    {
      entityType: "EquipmentComponent",
      conditionType: "date_due",
      thresholdDays: 7,
      notifyRoleKey: "warehouse_keeper",
    },
    {
      entityType: "EquipmentComponent",
      conditionType: "date_due",
      thresholdDays: 7,
      notifyRoleKey: "owner",
    },
    {
      entityType: "InventoryItem",
      conditionType: "quantity_below_min",
      thresholdDays: null,
      notifyRoleKey: "warehouse_keeper",
    },
    {
      entityType: "InventoryItem",
      conditionType: "quantity_below_min",
      thresholdDays: null,
      notifyRoleKey: "owner",
    },
    {
      entityType: "RentalContract",
      conditionType: "overdue",
      thresholdDays: null,
      notifyRoleKey: "rental_manager",
    },
    {
      entityType: "RentalContract",
      conditionType: "overdue",
      thresholdDays: null,
      notifyRoleKey: "owner",
    },
  ];
  for (const ruleSeed of alertRuleSeeds) {
    const existing = await prisma.alertRule.findFirst({
      where: {
        entityType: ruleSeed.entityType,
        conditionType: ruleSeed.conditionType,
        notifyRoleKey: ruleSeed.notifyRoleKey,
      },
    });
    if (!existing) {
      await prisma.alertRule.create({ data: ruleSeed });
    }
  }

  console.log("تم إنشاء الصلاحيات والأدوار ومستخدم المالك (owner / ChangeMe123!)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
