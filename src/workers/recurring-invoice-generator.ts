import "dotenv/config";
import cron from "node-cron";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generateInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`;
}

// بيتنفذ يوميًا: أي عقد إيجار متكرر (isRecurring) ووصل يوم فوترته الشهري
// (recurringDayOfMonth) بيتعمله فاتورة مسودة جديدة — طالما مفيش فاتورة
// اتعملت له في الشهر الحالي أصلًا (فحص referenceType/referenceId +
// issueDate)، عشان تشغيل الـworker أكتر من مرة في نفس اليوم ميكررش الفاتورة.
export async function generateRecurringInvoices() {
  const now = new Date();
  const today = now.getDate();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const contracts = await prisma.rentalContract.findMany({
    where: {
      isRecurring: true,
      status: "active",
      recurringDayOfMonth: { lte: today },
    },
  });

  for (const contract of contracts) {
    const existing = await prisma.invoice.findFirst({
      where: {
        referenceType: "RentalContract",
        referenceId: contract.id,
        issueDate: { gte: monthStart },
      },
    });
    if (existing) continue;

    const total = Number(contract.rateAmount);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        customerId: contract.customerId,
        status: "draft",
        referenceType: "RentalContract",
        referenceId: contract.id,
        rentalContractId: contract.id,
        total,
        lineItems: {
          create: [
            {
              description: `إيجار شهري متكرر — عقد ${contract.contractNumber}`,
              quantity: 1,
              unitPrice: total,
              taxRate: 0,
              lineTotal: total,
            },
          ],
        },
      },
    });

    // مفيش سجل audit هنا عمدًا — AuditLog.actorUserId FK بيتطلب User حقيقي،
    // والـworker ده مفيهوش مستخدم بشري ينفذ الفعل. مصدر الفاتورة واضح من
    // referenceType/referenceId (RentalContract) على الفاتورة نفسها.
    console.log(`generated invoice ${invoice.invoiceNumber} for contract ${contract.contractNumber}`);
  }
}

// الملف ده مبيتعملوش import من أي مكان تاني في المشروع — بيتشغل كـ CLI
// entrypoint بس (npm run worker:recurring-invoices)، فمحتاجش isMainModule
// guard (اللي كان بيفشل بصمت على Windows بسبب اختلاف صيغة المسار بين
// import.meta.url و process.argv[1]).
console.log("Recurring invoice generator worker started — running daily at 06:00.");
generateRecurringInvoices().catch((e) => console.error("recurring invoice generation failed:", e));
cron.schedule("0 6 * * *", () => {
  generateRecurringInvoices().catch((e) => console.error("recurring invoice generation failed:", e));
});
