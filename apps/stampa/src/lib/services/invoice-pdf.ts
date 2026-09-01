/**
 * The stamped invoice as paper (ticket T-02).
 *
 * This is the artefact a buyer's AP clerk opens and a supplier prints, so it
 * follows the same three rules as the S9 screen: hairlines rather than
 * shadows, tabular figures with a rule above the total, and the reference in
 * monospace. Mono on A4 is the target — no colour is required to read it.
 */
import { copy, formatDateTime, BRAND, TRUST } from "../copy";
import { formatKobo, formatNaira, kobo } from "../money";
import { Pdf, PAGE_HEIGHT, PAGE_WIDTH } from "../pdf";
import { isSimulatedGateway } from "../gateway";

export type PdfInvoice = {
  invoiceNumber: string;
  irn: string | null;
  stampedAt: Date | null;
  subtotalKobo: number;
  vatKobo: number;
  totalKobo: number;
  supplier: { businessName: string; tin: string | null; address: string };
  buyer: { legalName: string; tin: string; address: string };
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceKobo: number;
    vatBasisPoints: number;
    lineSubtotalKobo: number;
  }>;
};

const LEFT = 48;
const RIGHT = PAGE_WIDTH - 48;

export function renderInvoicePdf(invoice: PdfInvoice): Buffer {
  const pdf = new Pdf();
  let y = PAGE_HEIGHT - 64;

  // ---- Letterhead. The supplier's name leads; ours is a footer credit. ----
  pdf.text(invoice.supplier.businessName, LEFT, y, 16, "bold");
  pdf.textRight("TAX INVOICE", RIGHT, y, 12, "bold");
  y -= 16;
  pdf.text(invoice.supplier.address, LEFT, y, 9);
  y -= 12;
  if (invoice.supplier.tin) pdf.text(`TIN ${invoice.supplier.tin}`, LEFT, y, 9, "mono");

  y -= 20;
  pdf.rule(y);
  y -= 22;

  // ---- Parties ----
  pdf.text("Billed to", LEFT, y, 8);
  pdf.textRight("Invoice number", RIGHT, y, 8);
  y -= 14;
  pdf.text(invoice.buyer.legalName, LEFT, y, 11, "bold");
  pdf.textRight(invoice.invoiceNumber, RIGHT, y, 11, "mono");
  y -= 13;
  pdf.text(invoice.buyer.address, LEFT, y, 9);
  y -= 12;
  pdf.text(`TIN ${invoice.buyer.tin}`, LEFT, y, 9, "mono");
  if (invoice.stampedAt) {
    pdf.textRight(formatDateTime(invoice.stampedAt), RIGHT, y, 9);
  }

  y -= 30;
  pdf.rule(y);
  y -= 16;

  // ---- Line items ----
  pdf.text("Description", LEFT, y, 8);
  pdf.textRight("Qty", LEFT + 330, y, 8);
  pdf.textRight("Unit price", LEFT + 420, y, 8);
  pdf.textRight("Amount", RIGHT, y, 8);
  y -= 6;
  pdf.rule(y);
  y -= 18;

  for (const line of invoice.lines) {
    pdf.text(line.description.slice(0, 52), LEFT, y, 10);
    pdf.textRight(String(line.quantity), LEFT + 330, y, 10, "mono");
    pdf.textRight(formatKobo(kobo(line.unitPriceKobo)), LEFT + 420, y, 10, "mono");
    pdf.textRight(formatKobo(kobo(line.lineSubtotalKobo)), RIGHT, y, 10, "mono");
    y -= 18;
  }

  y -= 6;
  pdf.rule(y, LEFT + 300);
  y -= 18;

  pdf.textRight(copy.invoice.subtotal, LEFT + 420, y, 9);
  pdf.textRight(formatKobo(kobo(invoice.subtotalKobo)), RIGHT, y, 10, "mono");
  y -= 16;
  const rate = (invoice.lines[0]?.vatBasisPoints ?? 750) / 100;
  pdf.textRight(copy.invoice.vat(rate.toFixed(1)), LEFT + 420, y, 9);
  pdf.textRight(formatKobo(kobo(invoice.vatKobo)), RIGHT, y, 10, "mono");

  y -= 10;
  // The rule above the total. This is what makes it read as an account.
  pdf.rule(y, LEFT + 300, RIGHT, 1.2);
  y -= 20;
  pdf.textRight(copy.invoice.total, LEFT + 420, y, 10, "bold");
  pdf.textRight(formatNaira(kobo(invoice.totalKobo)), RIGHT, y, 12, "bold");

  // ---- The stamp block ----
  y -= 56;
  if (invoice.irn) {
    pdf.box(LEFT, y - 14, 250, 56);
    pdf.text("STAMPED", LEFT + 14, y + 22, 12, "bold");
    pdf.text(invoice.irn, LEFT + 14, y + 6, 11, "mono");
    if (invoice.stampedAt) {
      pdf.text(formatDateTime(invoice.stampedAt), LEFT + 14, y - 6, 8, "mono");
    }
    pdf.text(copy.stamped.reference, LEFT + 280, y + 22, 8);
    pdf.text(TRUST.notOurNumber, LEFT + 280, y + 8, 8);
  }

  if (isSimulatedGateway()) {
    y -= 34;
    pdf.text(copy.stamped.simulated, LEFT, y, 8, "bold");
  }

  // ---- Footer ----
  pdf.rule(56);
  pdf.text(`Sent through ${BRAND.name}. ${TRUST.free}`, LEFT, 42, 8);
  pdf.textRight(`${BRAND.supportPhone}`, RIGHT, 42, 8);

  return pdf.build();
}
