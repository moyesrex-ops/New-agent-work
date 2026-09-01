import { Button } from "@/components/Button";
import { FileField } from "@/components/Field";
import { Banner, Card } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { uploadVendorMaster } from "../actions";
import shell from "@/components/shell.module.css";

const ERRORS: Record<string, string> = {
  no_file: copy.buyer.uploadErrors.no_file,
  too_large: copy.buyer.uploadErrors.too_large,
  empty: copy.buyer.uploadErrors.empty,
  unreadable:
    "We could not find a vendor name or a phone number in that file. Check it has a header row.",
  expired: copy.buyer.uploadErrors.expired,
};

/** B3 Upload. */
export default async function Upload({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireBuyer();
  const { error } = await searchParams;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className={shell.title}>{copy.buyer.uploadHeading}</h1>
      <p className={shell.lede} style={{ marginBottom: "var(--space-5)" }}>
        {copy.buyer.uploadBody}
      </p>

      {error ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{ERRORS[error] ?? copy.errors.generic}</Banner>
        </div>
      ) : null}

      <Card>
        <form action={uploadVendorMaster}>
          <FileField
            name="file"
            label={copy.buyer.uploadLabel}
            accept=".csv,text/csv"
            required
            hint={copy.buyer.uploadHint}
          />
          <Button type="submit" block>
            {copy.buyer.uploadCta}
          </Button>
        </form>
      </Card>

      <p className={shell.note} style={{ marginTop: "var(--space-5)" }}>
        Not sure of the format? <a href="/c/upload/sample.csv">{copy.buyer.uploadSample}</a>
      </p>

      <section className={shell.section} style={{ marginTop: "var(--space-8)" }}>
        <h2 className={shell.sectionTitle}>{copy.buyer.uploadKeepHeading}</h2>
        <p className={shell.note}>
          Business name, phone, TIN, address, vendor code, category, bank name, the last four
          digits of the account number and annual spend if your export carries it. Nothing else,
          and never the file itself. Full account numbers are discarded during the read.
        </p>
      </section>
    </div>
  );
}
