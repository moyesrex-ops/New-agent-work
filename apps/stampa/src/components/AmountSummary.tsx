import { copy } from "@/lib/copy";
import { formatKobo, formatNaira, kobo } from "@/lib/money";
import shell from "./shell.module.css";

/**
 * Subtotal, VAT, total. Tabular mono, right-aligned, with a rule above the
 * total — the three things that make a set of numbers read as an account
 * rather than as a list (Phase 15.3).
 */
export function AmountSummary({
  subtotalKobo,
  vatKobo,
  totalKobo,
  vatBasisPoints,
}: {
  subtotalKobo: number;
  vatKobo: number;
  totalKobo: number;
  vatBasisPoints: number;
}) {
  return (
    <div>
      <div className={shell.row}>
        <span className={shell.note}>{copy.invoice.subtotal}</span>
        <span className={shell.mono}>{formatKobo(kobo(subtotalKobo))}</span>
      </div>
      <div className={shell.row}>
        <span className={shell.note}>
          {copy.invoice.vat((vatBasisPoints / 100).toFixed(1))}
        </span>
        <span className={shell.mono}>{formatKobo(kobo(vatKobo))}</span>
      </div>
      <div className={shell.totalRow}>
        <span style={{ fontWeight: "var(--font-weight-semibold)" }}>{copy.invoice.total}</span>
        <span className={shell.monoLarge}>{formatNaira(kobo(totalKobo))}</span>
      </div>
    </div>
  );
}
