import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderPdfFromUrl } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new Response("غير مصرح", { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!quote || quote.customer.portalToken !== token) {
    return new Response("غير موجود", { status: 404 });
  }

  const printUrl = new URL(
    `/portal/print/quotes/${id}?token=${token}`,
    request.nextUrl.origin
  ).toString();

  const pdfBuffer = await renderPdfFromUrl(printUrl, "");

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${id}.pdf"`,
    },
  });
}
