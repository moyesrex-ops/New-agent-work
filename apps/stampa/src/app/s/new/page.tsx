import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { AmountField, Field } from "@/components/Field";
import { StatusChip } from "@/components/Surfaces";
import { copy } from "@/lib/copy";
import { getDb } from "@/lib/db/client";
import { formatKobo, kobo } from "@/lib/money";
import { requireSupplier } from "@/lib/auth/require";
import { getInvoiceForSupplier } from "@/lib/services/invoices";
import { STANDARD_VAT_BASIS_POINTS } from "@/lib/vat";
import { createDraft } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const FIELD_ERRORS = copy.invoice.errors;

/**
 * S6 — New invoice, details.
 *
 * The customer is decided, so it is rendered as a chip rather than a disabled
 * select: a disabled control reads as broken, a chip reads as decided
 * (Phase 15.2). VAT is computed on the next screen and never typed.
 */
export default async function NewInvoice({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const principal = await requireSupplier();
  const { error, from } = await searchParams;

  const db = await getDb();
  const link = await db.query.supplierLinks.findFirst({
    where: (links, { eq }) => eq(links.supplierId, principal.supplierId),
    with: { organisation: true },
  });
  if (!link) redirect("/s");

  // "Edit invoice" on a rejected invoice lands here. Without the carried-over
  // values it is not an edit, it is an instruction to type everything again —
  // on a phone, having already been told the NRS said no.
  const previous = from ? await getInvoiceForSupplier(from, principal.supplierId) : null;
  const line = previous?.lines[0];

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.invoice.newHeading}</h1>

      <div className={shell.row}>
        <span className={shell.displayLabel}>{copy.invoice.to}</span>
        <StatusChip status="live" />
      </div>
      <p className={shell.lede}>{link.organisation.legalName}</p>

      <form action={createDraft}>
        <Field
          name="description"
          label={copy.invoice.what}
          placeholder={copy.invoice.whatPlaceholder}
          defaultValue={line?.description}
          error={error === "description" ? FIELD_ERRORS.description : undefined}
          required
        />
        <Field
          name="quantity"
          label={copy.invoice.quantity}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={line?.quantity ?? 1}
          error={error === "quantity" ? FIELD_ERRORS.quantity : undefined}
          required
        />
        <AmountField
          name="unitPrice"
          label={copy.invoice.unitPrice}
          placeholder="0.00"
          defaultValue={line ? formatKobo(kobo(line.unitPriceKobo)) : undefined}
          error={
            error === "unitPrice"
              ? FIELD_ERRORS.unitPrice
              : error === "zeroTotal"
                ? FIELD_ERRORS.zeroTotal
                : undefined
          }
          required
        />

        <p className={shell.note}>{copy.invoice.vatAdded((STANDARD_VAT_BASIS_POINTS / 100).toFixed(1))}</p>

        <div className={shell.actionBar}>
          <Button type="submit" block>
            {copy.invoice.review}
          </Button>
        </div>
      </form>
    </div>
  );
}
