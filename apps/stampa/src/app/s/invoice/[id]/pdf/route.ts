import { NextResponse } from "next/server";
import { requireSupplier } from "@/lib/auth/require";
import { getInvoiceForSupplier } from "@/lib/services/invoices";
import { renderInvoicePdf } from "@/lib/services/invoice-pdf";

/**
 * Generated on demand rather than stored. Scoped to the signed-in supplier, so
 * an invoice id in a URL is not a way to read someone else's invoice.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const principal = await requireSupplier();
  const { id } = await context.params;
  const invoice = await getInvoiceForSupplier(id, principal.supplierId);

  if (!invoice || invoice.status !== "stamped") {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdf = renderInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    irn: invoice.irn,
    stampedAt: invoice.stampedAt,
    subtotalKobo: invoice.subtotalKobo,
    vatKobo: invoice.vatKobo,
    totalKobo: invoice.totalKobo,
    supplier: {
      businessName: invoice.supplier.businessName,
      tin: invoice.supplier.tin,
      address: invoice.supplier.address,
    },
    buyer: {
      legalName: invoice.organisation.legalName,
      tin: invoice.organisation.tin,
      address: invoice.organisation.address,
    },
    lines: invoice.lines,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
