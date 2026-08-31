import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button, ButtonLink } from "@/components/Button";
import { SelectField } from "@/components/Field";
import { Banner, Card, DataTable } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { formatKobo, kobo } from "@/lib/money";
import { maskTin } from "@/lib/tin";
import { formatPhone } from "@/lib/phone";
import { readUpload } from "@/lib/services/staging";
import {
  ingestVendorMaster,
  OPTIONAL_COLUMNS,
  REQUIRED_COLUMNS,
  type ColumnKey,
  type ParsedVendor,
} from "@/lib/services/vendor-master";
import { confirmMapping, discardUpload } from "../../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const LABELS: Record<ColumnKey, string> = {
  businessName: "Vendor name",
  phone: "Phone number",
  tin: "TIN",
  address: "Address",
  vendorCode: "Vendor code",
  category: "Category",
  bankName: "Bank",
  bankLast4: "Account number",
  annualSpend: "Annual spend",
};

const ERRORS: Record<ColumnKey | string, string> = {
  businessName: copy.buyer.mappingMissing("vendor name"),
  phone: copy.buyer.mappingMissing("phone number"),
};

/**
 * B4 Column mapping.
 *
 * Auto-detection is right most of the time and this screen exists for the
 * times it is not. It shows the first five rows as we read them, because a
 * buyer can tell in one glance whether "Account Number" landed in the bank
 * column — and cannot tell that from a list of header names.
 */
export default async function MappingReview({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const principal = await requireBuyer();
  const { error } = await searchParams;

  const store = await cookies();
  const staged = readUpload(store.get("stampa_upload")?.value ?? "", principal.organisationId);
  if (!staged) redirect("/c/upload?error=expired");

  const parsed = ingestVendorMaster(staged.csv);
  const options = [
    { value: "", label: "— not in this file —" },
    ...parsed.headers.map((header, index) => ({
      value: String(index),
      label: header.trim() || `Column ${index + 1}`,
    })),
  ];

  return (
    <div>
      <h1 className={shell.title}>{copy.buyer.mappingHeading}</h1>
      <p className={shell.lede} style={{ marginBottom: "var(--space-5)" }}>
        {copy.buyer.mappingBody}
      </p>
      <p className={shell.note} style={{ marginBottom: "var(--space-6)" }}>
        {staged.filename} · {parsed.vendors.length} rows we can use
        {parsed.problems.length ? ` · ${parsed.problems.length} we cannot` : ""}
      </p>

      {error ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{ERRORS[error] ?? copy.errors.generic}</Banner>
        </div>
      ) : null}

      {parsed.tinsRecovered ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="warning">
            {copy.buyer.mappingRecovered(parsed.tinsRecovered)} Excel drops leading zeros from TINs
            when the column is formatted as a number. Check the preview below.
          </Banner>
        </div>
      ) : null}

      <form action={confirmMapping}>
        <section className={shell.section}>
          <div className={shell.grid2}>
            {([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as ColumnKey[]).map((key) => (
              <SelectField
                key={key}
                name={`column.${key}`}
                label={
                  REQUIRED_COLUMNS.includes(key as (typeof REQUIRED_COLUMNS)[number])
                    ? `${LABELS[key]} (required)`
                    : LABELS[key]
                }
                defaultValue={parsed.mapping[key] === undefined ? "" : String(parsed.mapping[key])}
                options={options}
              />
            ))}
          </div>
        </section>

        <section className={shell.section}>
          <h2 className={shell.sectionTitle}>First five rows, as we read them</h2>
          <Preview vendors={parsed.vendors.slice(0, 5)} />
        </section>

        {parsed.problems.length ? (
          <section className={shell.section}>
            <h2 className={shell.sectionTitle}>Rows we had to skip</h2>
            <Card>
              <ul className={shell.stackTight}>
                {parsed.problems.slice(0, 10).map((problem) => (
                  <li key={problem.rowNumber} className={shell.note}>
                    {copy.buyer.uploadRowError(problem.rowNumber, problem.problem)}
                  </li>
                ))}
              </ul>
              {parsed.problems.length > 10 ? (
                <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
                  And {parsed.problems.length - 10} more. Everything else still imports.
                </p>
              ) : null}
            </Card>
          </section>
        ) : null}

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button type="submit">{copy.buyer.mappingCta}</Button>
          <ButtonLink href="/c/upload" variant="secondary">
            Choose a different file
          </ButtonLink>
        </div>
      </form>

      <form action={discardUpload} style={{ marginTop: "var(--space-6)" }}>
        <Button type="submit" variant="quiet">
          Discard this upload
        </Button>
      </form>
    </div>
  );
}

function Preview({ vendors }: { vendors: ParsedVendor[] }) {
  return (
    <DataTable
      caption="First five rows of the vendor master as parsed"
      rows={vendors}
      empty={
        <Card>
          <p className={shell.note}>
            No rows could be read with this mapping. Check the vendor name and phone columns above.
          </p>
        </Card>
      }
      columns={[
        { key: "name", header: "Vendor name", render: (row) => row.businessName },
        { key: "phone", header: "Phone", render: (row) => formatPhone(row.phone) },
        {
          key: "tin",
          header: "TIN",
          render: (row) =>
            row.tin ? (
              <>
                {maskTin(row.tin)}
                {row.tinRecovered ? <span className={shell.note}> · zero restored</span> : null}
              </>
            ) : (
              <span className={shell.note}>missing</span>
            ),
        },
        {
          key: "bank",
          header: "Bank",
          render: (row) =>
            row.bankName ? `${row.bankName} ••••${row.bankLast4 ?? "????"}` : "—",
        },
        {
          key: "spend",
          header: "Annual spend",
          numeric: true,
          render: (row) =>
            row.annualSpendKobo === null ? "—" : formatKobo(kobo(row.annualSpendKobo)),
        },
      ]}
    />
  );
}
