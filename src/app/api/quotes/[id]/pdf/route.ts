import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { renderPdfFromUrl } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSIONS.QUOTE_READ);
  const { id } = await params;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const printUrl = new URL(`/accounting/quotes/${id}/print`, request.nextUrl.origin).toString();

  const pdfBuffer = await renderPdfFromUrl(printUrl, cookieHeader);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${id}.pdf"`,
    },
  });
}
