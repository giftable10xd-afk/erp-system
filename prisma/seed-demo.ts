import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureUser(username: string, fullNameAr: string, roleKey: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return existing;

  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const passwordHash = await hash(`${roleKey[0].toUpperCase()}${roleKey.slice(1)}123!`);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullNameAr,
      isActive: true,
      roles: { create: [{ roleId: role.id }] },
    },
  });
  return user;
}

async function main() {
  console.log("بدء ملء بيانات الديمو...");

  // ─── مستخدمين لكل دور (لعرض RBAC بشكل كامل) ───
  const eng1 = await ensureUser("eng1", "المهندس كريم فوزي", "engineer");
  const eng2 = await ensureUser("eng2", "المهندس عمر خالد", "engineer");
  const accountant1 = await ensureUser("accountant1", "هالة عبد الرحمن", "accountant");
  const warehouse1 = await ensureUser("warehouse1", "محمد إبراهيم", "warehouse_keeper");
  const rental1 = await ensureUser("rental1", "منى الشناوي", "rental_manager");
  const support1 = await ensureUser("support1", "كريم فتحي", "support_agent");
  console.log("✓ المستخدمين");

  // ─── المعدات ───
  const equipmentSeeds = [
    { assetTag: "GEN-001", type: "generator", brand: "Cummins", model: "C150", status: "active" },
    { assetTag: "GEN-002", type: "generator", brand: "Perkins", model: "P200", status: "in_maintenance" },
    { assetTag: "GEN-003", type: "generator", brand: "Caterpillar", model: "C300", status: "rented" },
    { assetTag: "GEN-004", type: "generator", brand: "FG Wilson", model: "W150", status: "active" },
    { assetTag: "GEN-005", type: "generator", brand: "Cummins", model: "C400", status: "active" },
    { assetTag: "TRC-001", type: "tractor", brand: "John Deere", model: "5075E", status: "active" },
    { assetTag: "TRC-002", type: "tractor", brand: "Massey Ferguson", model: "MF385", status: "retired" },
    { assetTag: "TRC-003", type: "tractor", brand: "New Holland", model: "TD5.90", status: "active" },
  ];

  const equipment: Record<string, Awaited<ReturnType<typeof prisma.equipment.create>>> = {};
  for (const seed of equipmentSeeds) {
    equipment[seed.assetTag] = await prisma.equipment.upsert({
      where: { assetTag: seed.assetTag },
      update: {},
      create: { ...seed, serialNumber: `SN-${seed.assetTag}-${Math.floor(Math.random() * 90000 + 10000)}` },
    });
  }
  console.log("✓ المعدات");

  // ─── قطع المعدات (فلاتر/زيوت/بخاخات) مع استحقاقات متنوعة لتفعيل التنبيهات ───
  const componentPlans: {
    tag: string;
    componentType: string;
    name: string;
    dueInDays: number;
  }[] = [
    { tag: "GEN-001", componentType: "filter", name: "فلتر زيت", dueInDays: 3 },
    { tag: "GEN-001", componentType: "oil", name: "زيت محرك 15W40", dueInDays: 45 },
    { tag: "GEN-002", componentType: "filter", name: "فلتر سولار", dueInDays: -2 },
    { tag: "GEN-002", componentType: "injector", name: "بخاخ حاقن رقم 1", dueInDays: 5 },
    { tag: "GEN-003", componentType: "filter", name: "فلتر هواء", dueInDays: 60 },
    { tag: "GEN-004", componentType: "oil", name: "زيت محرك 20W50", dueInDays: 4 },
    { tag: "GEN-005", componentType: "filter", name: "فلتر زيت", dueInDays: 90 },
    { tag: "TRC-001", componentType: "oil", name: "زيت هيدروليك", dueInDays: 30 },
    { tag: "TRC-003", componentType: "filter", name: "فلتر سولار", dueInDays: 2 },
  ];

  for (const plan of componentPlans) {
    const existing = await prisma.equipmentComponent.findFirst({
      where: { equipmentId: equipment[plan.tag].id, name: plan.name },
    });
    if (existing) continue;
    await prisma.equipmentComponent.create({
      data: {
        equipmentId: equipment[plan.tag].id,
        componentType: plan.componentType,
        name: plan.name,
        installedAt: daysFromNow(-60),
        lastServiceAt: daysFromNow(-30),
        nextDueAt: daysFromNow(plan.dueInDays),
      },
    });
  }
  console.log("✓ قطع المعدات");

  // ─── أصناف المخزون ───
  const inventorySeeds = [
    { sku: "OIL-15W40", nameAr: "زيت محرك 15W40", unit: "لتر", currentQuantity: 70, reorderLevel: 20 },
    { sku: "OIL-20W50", nameAr: "زيت محرك 20W50", unit: "لتر", currentQuantity: 40, reorderLevel: 15 },
    { sku: "FLT-OIL-STD", nameAr: "فلتر زيت قياسي", unit: "قطعة", currentQuantity: 25, reorderLevel: 10 },
    { sku: "FLT-AIR-STD", nameAr: "فلتر هواء قياسي", unit: "قطعة", currentQuantity: 18, reorderLevel: 8 },
    { sku: "FLT-FUEL-STD", nameAr: "فلتر سولار قياسي", unit: "قطعة", currentQuantity: 6, reorderLevel: 10 },
    { sku: "INJ-NOZZLE-A", nameAr: "بخاخ حاقن نوع A", unit: "قطعة", currentQuantity: 5, reorderLevel: 4 },
    { sku: "COOLANT-50L", nameAr: "سائل تبريد", unit: "لتر", currentQuantity: 80, reorderLevel: 30 },
    { sku: "BELT-V-STD", nameAr: "سير V قياسي", unit: "قطعة", currentQuantity: 12, reorderLevel: 6 },
    { sku: "GREASE-5KG", nameAr: "شحم صناعي 5 كجم", unit: "علبة", currentQuantity: 9, reorderLevel: 5 },
    { sku: "DIESEL-BULK", nameAr: "مازوت (خزان الورشة)", unit: "لتر", currentQuantity: 150, reorderLevel: 200 },
    { sku: "BATTERY-12V", nameAr: "بطارية 12 فولت", unit: "قطعة", currentQuantity: 4, reorderLevel: 3 },
  ];

  const inventory: Record<string, Awaited<ReturnType<typeof prisma.inventoryItem.create>>> = {};
  for (const seed of inventorySeeds) {
    inventory[seed.sku] = await prisma.inventoryItem.upsert({
      where: { sku: seed.sku },
      update: {},
      create: { ...seed, currentQuantity: seed.currentQuantity, reorderLevel: seed.reorderLevel },
    });
  }
  console.log("✓ أصناف المخزون");

  // ─── موظفين ───
  const employeeSeeds = [
    { fullNameAr: "المهندس كريم فوزي", position: "مهندس صيانة", baseSalary: 9500, userId: eng1.id },
    { fullNameAr: "المهندس عمر خالد", position: "مهندس صيانة", baseSalary: 9000, userId: eng2.id },
    { fullNameAr: "هالة عبد الرحمن", position: "محاسبة", baseSalary: 8500, userId: accountant1.id },
    { fullNameAr: "محمد إبراهيم", position: "أمين مخزن", baseSalary: 6500, userId: warehouse1.id },
    { fullNameAr: "منى الشناوي", position: "مسؤولة إيجارات", baseSalary: 7500, userId: rental1.id },
    { fullNameAr: "كريم فتحي", position: "موظف دعم فني", baseSalary: 6000, userId: support1.id },
    { fullNameAr: "سيد عبد الله", position: "سائق", baseSalary: 5000, userId: null },
    { fullNameAr: "ياسمين طارق", position: "سكرتارية", baseSalary: 5500, userId: null },
  ];

  const employees: Awaited<ReturnType<typeof prisma.employee.create>>[] = [];
  for (const seed of employeeSeeds) {
    const existing = seed.userId
      ? await prisma.employee.findUnique({ where: { userId: seed.userId } })
      : await prisma.employee.findFirst({ where: { fullNameAr: seed.fullNameAr } });
    if (existing) {
      employees.push(existing);
      continue;
    }
    const emp = await prisma.employee.create({
      data: {
        fullNameAr: seed.fullNameAr,
        position: seed.position,
        hireDate: daysFromNow(-365),
        baseSalary: seed.baseSalary,
        userId: seed.userId ?? undefined,
      },
    });
    employees.push(emp);
  }
  console.log("✓ الموظفين");

  // ─── حضور آخر ٧ أيام ───
  const attendanceStatuses = ["present", "present", "present", "late", "present", "absent", "leave"];
  for (const emp of employees) {
    for (let i = 0; i < 7; i++) {
      const date = daysFromNow(-i);
      date.setHours(0, 0, 0, 0);
      const status = attendanceStatuses[(i + employees.indexOf(emp)) % attendanceStatuses.length];
      await prisma.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId: emp.id, date } },
        update: {},
        create: {
          employeeId: emp.id,
          date,
          status,
          checkIn: status === "present" || status === "late" ? daysFromNow(-i) : null,
        },
      });
    }
  }
  console.log("✓ الحضور");

  // ─── مرتبات الشهر الحالي ───
  const now = new Date();
  for (const emp of employees) {
    const existing = await prisma.payrollRecord.findUnique({
      where: {
        employeeId_periodMonth_periodYear: {
          employeeId: emp.id,
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      },
    });
    if (existing) continue;
    const deduction = Math.round(Number(emp.baseSalary) * 0.02);
    await prisma.payrollRecord.create({
      data: {
        employeeId: emp.id,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        baseSalary: emp.baseSalary,
        deductionsTotal: deduction,
        additionsTotal: 0,
        netPay: Number(emp.baseSalary) - deduction,
        status: "draft",
        adjustments: {
          create: [
            {
              type: "deduction",
              reason: "خصم تأخير",
              amount: deduction,
              createdByUserId: accountant1.id,
            },
          ],
        },
      },
    });
  }
  console.log("✓ المرتبات");

  // ─── العملاء ───
  const customerSeeds = [
    { nameAr: "شركة النور للمقاولات", phone: "01012345678", type: "company", taxId: "123-456-789" },
    { nameAr: "شركة ألفا للمقاولات", phone: "01098765432", type: "company", taxId: "234-567-890" },
    { nameAr: "مصنع الأمل للأخشاب", phone: "01055512345", type: "company", taxId: "345-678-901" },
    { nameAr: "شركة النيل للاستصلاح الزراعي", phone: "01122334455", type: "company", taxId: "456-789-012" },
    { nameAr: "محمود عبد العزيز", phone: "01234567890", type: "individual", taxId: null },
    { nameAr: "سوبر ماركت الخير", phone: "01599988776", type: "company", taxId: "567-890-123" },
  ];

  const customers: Awaited<ReturnType<typeof prisma.customer.create>>[] = [];
  for (const seed of customerSeeds) {
    let customer = await prisma.customer.findFirst({ where: { nameAr: seed.nameAr } });
    if (!customer) {
      customer = await prisma.customer.create({ data: seed });
    }
    customers.push(customer);
  }
  console.log("✓ العملاء");

  // ─── عقود الإيجار ───
  const rentalPlans = [
    { customer: customers[0], tag: "GEN-003", start: -10, end: 20, rate: 500, status: "active" },
    { customer: customers[1], tag: "TRC-003", start: -20, end: -5, rate: 350, status: "active" },
  ];

  const rentalContracts: Awaited<ReturnType<typeof prisma.rentalContract.create>>[] = [];
  for (const plan of rentalPlans) {
    const existing = await prisma.rentalContract.findFirst({
      where: { customerId: plan.customer.id, equipmentId: equipment[plan.tag].id },
    });
    if (existing) {
      rentalContracts.push(existing);
      continue;
    }
    const contract = await prisma.rentalContract.create({
      data: {
        contractNumber: `RENT-DEMO-${plan.tag}`,
        customerId: plan.customer.id,
        equipmentId: equipment[plan.tag].id,
        startDate: daysFromNow(plan.start),
        expectedReturnDate: daysFromNow(plan.end),
        rateAmount: plan.rate,
        status: plan.status,
      },
    });
    rentalContracts.push(contract);
  }
  console.log("✓ عقود الإيجار (فيها عقد متأخر عمدًا لتفعيل التنبيه)");

  // ─── عمليات صيانة (تستهلك مخزون فعليًا وتحدّث القطع) ───
  const maintenancePlans = [
    { tag: "GEN-001", engineer: eng1, item: "OIL-15W40", qty: 15, jobType: "routine", startedAt: -6 },
    { tag: "GEN-002", engineer: eng2, item: "FLT-FUEL-STD", qty: 2, jobType: "repair", startedAt: -4 },
    { tag: "GEN-004", engineer: eng1, item: "OIL-20W50", qty: 10, jobType: "routine", startedAt: -3 },
    { tag: "TRC-001", engineer: eng2, item: "COOLANT-50L", qty: 8, jobType: "routine", startedAt: -2 },
    { tag: "GEN-005", engineer: eng1, item: "FLT-OIL-STD", qty: 1, jobType: "routine", startedAt: -1 },
  ];

  for (const plan of maintenancePlans) {
    const existing = await prisma.maintenanceJob.findFirst({
      where: { equipmentId: equipment[plan.tag].id, engineerUserId: plan.engineer.id, jobType: plan.jobType },
    });
    if (existing) continue;

    // نفس ضمان عدم السماح برصيد سالب اللي بيفرضه createMaintenanceJobAction
    // الحقيقي — لو الصنف ده كان عليه استهلاك من اختبارات سابقة في نفس
    // القاعدة، منكسرش الرصيد بصمت زي ما حصل قبل كده.
    const currentItem = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: inventory[plan.item].id },
    });
    if (Number(currentItem.currentQuantity) < plan.qty) {
      console.warn(
        `  ⚠ تخطي استهلاك ${plan.qty} من ${plan.item} (الرصيد الحالي ${currentItem.currentQuantity} غير كافٍ)`
      );
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const job = await tx.maintenanceJob.create({
        data: {
          equipmentId: equipment[plan.tag].id,
          engineerUserId: plan.engineer.id,
          jobType: plan.jobType,
          status: "completed",
          description: "صيانة دورية ضمن بيانات العرض التوضيحي",
          startedAt: daysFromNow(plan.startedAt),
          completedAt: daysFromNow(plan.startedAt),
        },
      });
      await tx.inventoryItem.update({
        where: { id: inventory[plan.item].id },
        data: { currentQuantity: { decrement: plan.qty } },
      });
      await tx.maintenanceJobItem.create({
        data: { maintenanceJobId: job.id, inventoryItemId: inventory[plan.item].id, quantity: plan.qty },
      });
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory[plan.item].id,
          quantityChange: -plan.qty,
          movementType: "maintenance_out",
          referenceType: "MaintenanceJob",
          referenceId: job.id,
          destinationEquipmentId: equipment[plan.tag].id,
          performedByUserId: plan.engineer.id,
          occurredAt: daysFromNow(plan.startedAt),
        },
      });
    });
  }
  console.log("✓ عمليات الصيانة");

  // ─── فواتير ودفعات ───
  const invoicePlans = [
    {
      customer: customers[0],
      rentalContract: rentalContracts[0],
      lines: [{ description: "إيجار مولد GEN-003 (شهر)", quantity: 1, unitPrice: 15000, taxRate: 14 }],
      status: "paid",
      pay: true,
    },
    {
      customer: customers[1],
      rentalContract: rentalContracts[1],
      lines: [{ description: "إيجار تركتور TRC-003", quantity: 1, unitPrice: 10500, taxRate: 14 }],
      status: "issued",
      pay: false,
    },
    {
      customer: customers[2],
      rentalContract: null,
      lines: [{ description: "صيانة طارئة", quantity: 1, unitPrice: 2500, taxRate: 14 }],
      status: "issued",
      pay: false,
    },
    {
      customer: customers[3],
      rentalContract: null,
      lines: [{ description: "توريد قطع غيار", quantity: 3, unitPrice: 800, taxRate: 14 }],
      status: "draft",
      pay: false,
    },
  ];

  let invoiceCounter = 0;
  for (const plan of invoicePlans) {
    invoiceCounter += 1;
    const invoiceNumber = `INV-DEMO-${invoiceCounter}`;
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existing) continue;

    const total = plan.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitPrice * (1 + l.taxRate / 100),
      0
    );

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: plan.customer.id,
        status: plan.status,
        referenceType: plan.rentalContract ? "RentalContract" : "manual",
        rentalContractId: plan.rentalContract?.id,
        total,
        lineItems: {
          create: plan.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
            lineTotal: l.quantity * l.unitPrice * (1 + l.taxRate / 100),
          })),
        },
      },
    });

    if (plan.pay) {
      await prisma.payment.create({
        data: { invoiceId: invoice.id, amount: total, method: "bank_transfer" },
      });
    }
  }
  console.log("✓ الفواتير والدفعات");

  // ─── طلبات الدعم الفني ───
  const ticketPlans = [
    {
      subject: "المولد GEN-002 بيسخن بسرعة",
      priority: "high",
      status: "in_progress",
      equipment: equipment["GEN-002"],
      customer: null,
      comment: "المهندس عمر رايح يفحصه النهاردة",
    },
    {
      subject: "طلب صيانة وقائية شهرية",
      priority: "normal",
      status: "open",
      equipment: equipment["TRC-001"],
      customer: customers[3],
      comment: null,
    },
    {
      subject: "استفسار عن فاتورة الإيجار",
      priority: "low",
      status: "resolved",
      equipment: null,
      customer: customers[1],
      comment: "تم الرد على العميل وتوضيح تفاصيل الفاتورة",
    },
    {
      subject: "عطل مفاجئ في التركتور TRC-003",
      priority: "urgent",
      status: "open",
      equipment: equipment["TRC-003"],
      customer: customers[1],
      comment: null,
    },
  ];

  let ticketCounter = 0;
  for (const plan of ticketPlans) {
    ticketCounter += 1;
    const ticketNumber = `TCK-DEMO-${ticketCounter}`;
    const existing = await prisma.supportTicket.findUnique({ where: { ticketNumber } });
    if (existing) continue;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: plan.subject,
        priority: plan.priority,
        status: plan.status,
        equipmentId: plan.equipment?.id,
        customerId: plan.customer?.id,
        assignedToUserId: support1.id,
      },
    });

    if (plan.comment) {
      await prisma.ticketComment.create({
        data: { ticketId: ticket.id, authorUserId: support1.id, body: plan.comment },
      });
    }
  }
  console.log("✓ طلبات الدعم الفني");

  console.log("\nتمت تعبئة بيانات العرض التوضيحي بنجاح.");
  console.log("مستخدمين إضافيين للتجربة:");
  console.log("  eng2 / Engineer123!  (مهندس)");
  console.log("  accountant1 / Accountant123!  (محاسب)");
  console.log("  warehouse1 / Warehouse123!  (أمين مخزن)");
  console.log("  rental1 / Rental123!  (مسؤول إيجارات)");
  console.log("  support1 / Support123!  (دعم فني)");
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
