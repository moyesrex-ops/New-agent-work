import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Surfaces";
import { copy } from "@/lib/copy";
import { formatPhone } from "@/lib/phone";
import { getDb } from "@/lib/db/client";
import { requireSupplier } from "@/lib/auth/require";
import { signOut } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** S14 — Account. Control and exit, with no retention friction. */
export default async function Account() {
  const principal = await requireSupplier();
  const db = await getDb();
  const supplier = await db.query.suppliers.findFirst({
    where: (rows, { eq }) => eq(rows.id, principal.supplierId),
  });

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.account.heading}</h1>

      <Card>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>{copy.confirm.businessName}</span>
          <span className={shell.displayValue}>{supplier?.businessName}</span>
        </div>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>{copy.confirm.tin}</span>
          <span className={`${shell.displayValue} ${shell.mono}`}>{supplier?.tin}</span>
        </div>
        <div className={shell.displayRow}>
          <span className={shell.displayLabel}>{copy.phone.label}</span>
          <span className={shell.displayValue}>{formatPhone(supplier?.phone ?? "")}</span>
        </div>
      </Card>

      <Card>
        <p style={{ fontWeight: "var(--font-weight-semibold)" }}>{copy.account.dataHeading}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          {copy.account.downloadBody}
        </p>
        <p style={{ marginTop: "var(--space-3)" }}>
          <a href="/s/account/export">{copy.account.download}</a>
        </p>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="secondary" block>
          {copy.account.signOut}
        </Button>
      </form>

      <p className={shell.note}>
        <Link href="/s/account/delete">{copy.account.deleteLink}</Link>
      </p>
    </div>
  );
}
