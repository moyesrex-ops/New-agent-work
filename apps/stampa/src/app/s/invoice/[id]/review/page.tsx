import { notFound, redirect } from "next/navigation";
import { AmountSummary } from "@/components/AmountSummary";
import { Button, ButtonLink } from "@/components/Button";
import { DocumentCard } from "@/components/Surfaces";
import { copy } from "@/lib/copy";
import { formatNaira, kobo } from "@/lib/money";
import { requireSupplier } from "@/lib/auth/require";
import { getInvoiceForSupplier } from "@/lib/services/invoices";
import { sendDraft } from "../../../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** S7 — Review. Exactly what will be sent, nothing hidden. */
export default async function ReviewInvoice({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireSupplier();
  const { id } = await params;
  const invoice = await getInvoiceForSupplier(id, principal.supplierId);
  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/s/invoice/${id}`);

  const [line] = invoice.lines;

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.invoice.reviewHeading}</h1>
      <p className={shell.lede}>{copy.invoice.reviewBody}</p>

      <DocumentCard label={`Invoice ${invoice.invoiceNumber}`}>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>{copy.invoice.to}</span>
          <span className={shell.displayValue}>{invoice.organisation.legalName}</span>
        </div>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>{copy.invoice.what}</span>
          <span className={shell.displayValue}>{line.description}</span>
        </div>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>
            {copy.invoice.quantity} × {copy.invoice.unitPrice}
          </span>
          <span className={shell.displayValue}>
            {line.quantity} × {formatNaira(kobo(line.unitPriceKobo))}
          </span>
        </div>
        <div style={{ marginTop: "var(--space-4)" }}>
          <AmountSummary
            subtotalKobo={invoice.subtotalKobo}
            vatKobo={invoice.vatKobo}
            totalKobo={invoice.totalKobo}
            vatBasisPoints={line.vatBasisPoints}
          />
        </div>
      </DocumentCard>

      <form action={sendDraft} className={shell.actionBar}>
        <input type="hidden" name="invoiceId" value={invoice.id} />
        <Button type="submit" block>
          {copy.invoice.send}
        </Button>
      </form>

      <ButtonLink href="/s/new" variant="quiet">
        {copy.invoice.back}
      </ButtonLink>
    </div>
  );
}
