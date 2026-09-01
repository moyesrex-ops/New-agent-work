import { NextResponse } from "next/server";
import { requireSupplier } from "@/lib/auth/require";
import { exportInvoicesCsv } from "@/lib/services/account";

/** Everything the supplier gave us, back in a form they can open. */
export async function GET() {
  const principal = await requireSupplier();
  const csv = await exportInvoicesCsv(principal.supplierId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="stampa-invoices.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
