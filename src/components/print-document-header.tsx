import { formatDate } from "@/lib/format";

export function PrintDocumentHeader({
  documentTitleAr,
  documentNumber,
  issueDate,
  settings,
}: {
  documentTitleAr: string;
  documentNumber: string;
  issueDate: Date;
  settings: {
    companyNameAr: string;
    taxId: string | null;
    address: string | null;
    phone: string | null;
    logoUrl: string | null;
  };
}) {
  return (
    <div className="mb-8 flex items-start justify-between border-b pb-6">
      <div>
        <h1 className="text-2xl font-bold">{documentTitleAr}</h1>
        <p className="ltr-technical text-sm text-muted-foreground">{documentNumber}</p>
      </div>
      <div className="text-end text-sm">
        {settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="" className="mb-2 h-10 w-auto object-contain" />
        )}
        <p className="font-bold">{settings.companyNameAr}</p>
        {settings.taxId && (
          <p className="ltr-technical text-muted-foreground">الرقم الضريبي: {settings.taxId}</p>
        )}
        {settings.address && <p className="text-muted-foreground">{settings.address}</p>}
        {settings.phone && <p className="ltr-technical text-muted-foreground">{settings.phone}</p>}
        <p className="text-muted-foreground">{formatDate(issueDate)}</p>
      </div>
    </div>
  );
}
