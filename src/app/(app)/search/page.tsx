import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">البحث الشامل</h1>
        <p className="text-sm text-muted-foreground">اكتب كلمة البحث في الأعلى</p>
      </div>
    );
  }

  const insensitive = { contains: query, mode: "insensitive" as const };

  const [equipment, inventoryItems, customers, tickets, invoices, contracts] =
    await Promise.all([
      session.permissions.has(PERMISSIONS.INVENTORY_READ)
        ? prisma.equipment.findMany({
            where: {
              OR: [
                { assetTag: insensitive },
                { brand: insensitive },
                { model: insensitive },
                { serialNumber: insensitive },
              ],
            },
            take: 10,
          })
        : [],
      session.permissions.has(PERMISSIONS.INVENTORY_READ)
        ? prisma.inventoryItem.findMany({
            where: { OR: [{ sku: insensitive }, { nameAr: insensitive }] },
            take: 10,
          })
        : [],
      session.permissions.has(PERMISSIONS.RENTALS_READ)
        ? prisma.customer.findMany({
            where: { OR: [{ nameAr: insensitive }, { phone: insensitive }] },
            take: 10,
          })
        : [],
      session.permissions.has(PERMISSIONS.SUPPORT_READ)
        ? prisma.supportTicket.findMany({
            where: { OR: [{ subject: insensitive }, { ticketNumber: insensitive }] },
            take: 10,
          })
        : [],
      session.permissions.has(PERMISSIONS.ACCOUNTING_READ)
        ? prisma.invoice.findMany({
            where: { invoiceNumber: insensitive },
            take: 10,
            include: { customer: true },
          })
        : [],
      session.permissions.has(PERMISSIONS.RENTALS_READ)
        ? prisma.rentalContract.findMany({
            where: { contractNumber: insensitive },
            take: 10,
            include: { customer: true },
          })
        : [],
    ]);

  const totalResults =
    equipment.length +
    inventoryItems.length +
    customers.length +
    tickets.length +
    invoices.length +
    contracts.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">نتائج البحث عن &quot;{query}&quot;</h1>
        <p className="text-sm text-muted-foreground">{totalResults} نتيجة</p>
      </div>

      {totalResults === 0 && (
        <p className="text-sm text-muted-foreground">مفيش نتائج مطابقة</p>
      )}

      {equipment.length > 0 && (
        <ResultSection title="المعدات">
          {equipment.map((e) => (
            <ResultRow key={e.id} href={`/equipment/${e.id}`}>
              <span className="ltr-technical">{e.assetTag}</span>
              {(e.brand || e.model) && ` — ${[e.brand, e.model].filter(Boolean).join(" ")}`}
            </ResultRow>
          ))}
        </ResultSection>
      )}

      {inventoryItems.length > 0 && (
        <ResultSection title="أصناف المخزون">
          {inventoryItems.map((i) => (
            <ResultRow key={i.id} href="/equipment/inventory">
              {i.nameAr} — <span className="ltr-technical">{i.sku}</span>
            </ResultRow>
          ))}
        </ResultSection>
      )}

      {customers.length > 0 && (
        <ResultSection title="العملاء">
          {customers.map((c) => (
            <ResultRow key={c.id} href="/rentals/customers">
              {c.nameAr}
              {c.phone && <span className="ltr-technical"> — {c.phone}</span>}
            </ResultRow>
          ))}
        </ResultSection>
      )}

      {tickets.length > 0 && (
        <ResultSection title="طلبات الدعم">
          {tickets.map((t) => (
            <ResultRow key={t.id} href={`/support/${t.id}`}>
              {t.subject} — <span className="ltr-technical">{t.ticketNumber}</span>
            </ResultRow>
          ))}
        </ResultSection>
      )}

      {invoices.length > 0 && (
        <ResultSection title="الفواتير">
          {invoices.map((inv) => (
            <ResultRow key={inv.id} href={`/accounting/${inv.id}`}>
              <span className="ltr-technical">{inv.invoiceNumber}</span> — {inv.customer.nameAr}
            </ResultRow>
          ))}
        </ResultSection>
      )}

      {contracts.length > 0 && (
        <ResultSection title="عقود الإيجار">
          {contracts.map((c) => (
            <ResultRow key={c.id} href={`/rentals/${c.id}`}>
              <span className="ltr-technical">{c.contractNumber}</span> — {c.customer.nameAr}
            </ResultRow>
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function ResultRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="border-b pb-2 last:border-0 hover:text-primary">
      {children}
    </Link>
  );
}
