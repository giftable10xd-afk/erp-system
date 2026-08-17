import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/format";
import { INVOICE_STATUS_LABELS, QUOTE_STATUS_LABELS } from "@/lib/labels";
import { getSettings } from "@/lib/settings";

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const customer = await prisma.customer.findUnique({
    where: { portalToken: token },
    include: {
      invoices: { orderBy: { issueDate: "desc" }, include: { payments: true } },
      quotes: { orderBy: { issueDate: "desc" } },
    },
  });

  if (!customer) notFound();

  const settings = await getSettings();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 bg-background p-6 text-foreground sm:p-10">
      <div className="border-b pb-6">
        <p className="text-sm text-muted-foreground">{settings.companyNameAr}</p>
        <h1 className="text-2xl font-bold">أهلًا، {customer.nameAr}</h1>
        <p className="text-sm text-muted-foreground">فواتيرك وعروض أسعارك</p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">الفواتير</h2>
        {customer.invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش فواتير لسه</p>
        ) : (
          <div className="flex flex-col gap-2">
            {customer.invoices.map((inv) => {
              const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <a
                  key={inv.id}
                  href={`/api/portal/invoices/${inv.id}/pdf?token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm hover:bg-muted"
                >
                  <div>
                    <p className="ltr-technical font-medium">{inv.invoiceNumber}</p>
                    <p className="text-muted-foreground">{formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold">{formatCurrency(inv.total.toString())}</p>
                    <p className="text-muted-foreground">
                      {INVOICE_STATUS_LABELS[inv.status] ?? inv.status} — مدفوع {formatCurrency(paid.toString())}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">عروض الأسعار</h2>
        {customer.quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">مفيش عروض أسعار لسه</p>
        ) : (
          <div className="flex flex-col gap-2">
            {customer.quotes.map((q) => (
              <a
                key={q.id}
                href={`/api/portal/quotes/${q.id}/pdf?token=${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border bg-card p-4 text-sm hover:bg-muted"
              >
                <div>
                  <p className="ltr-technical font-medium">{q.quoteNumber}</p>
                  <p className="text-muted-foreground">{formatDate(q.issueDate)}</p>
                </div>
                <div className="text-end">
                  <p className="font-bold">{formatCurrency(q.total.toString())}</p>
                  <p className="text-muted-foreground">{QUOTE_STATUS_LABELS[q.status] ?? q.status}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
