/**
 * Vendor master ingest (tickets B-01, B-02).
 *
 * Two rules from the architecture review shape this file:
 *
 *   1. We extract eight fields and discard the raw file. Becoming the
 *      custodian of a corporate's complete supplier database is a much larger
 *      breach than anything else here and it buys us nothing.
 *   2. Nothing is silently corrected. A recovered TIN is reported back to the
 *      buyer with a count, because reshaping a tax identifier behind someone's
 *      back is not a favour.
 */
import { parseAmountToKobo } from "../money";
import { parsePhone } from "../phone";
import { parseTin } from "../tin";

/** RFC 4180-ish: quoted fields, escaped quotes, CRLF, trailing newline. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Drop blank trailing lines rather than reporting them as bad rows.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export const REQUIRED_COLUMNS = ["businessName", "phone"] as const;
export const OPTIONAL_COLUMNS = [
  "tin",
  "address",
  "vendorCode",
  "category",
  "bankName",
  "bankLast4",
  /**
   * Annual spend, if their export carries it. This is what makes the exposure
   * figure sourceable to the buyer's own numbers instead of to an assumption
   * we invented — and a number a Financial Controller cannot source is a
   * number they will not forward (Phase 15.2).
   */
  "annualSpend",
] as const;

export type ColumnKey = (typeof REQUIRED_COLUMNS)[number] | (typeof OPTIONAL_COLUMNS)[number];

/**
 * Header synonyms seen in real Nigerian ERP exports. The list is long on
 * purpose: every unmatched header is a Financial Controller doing manual work
 * on their first visit.
 */
const SYNONYMS: Record<ColumnKey, string[]> = {
  businessName: ["vendor name", "supplier name", "business name", "name", "company", "vendor", "payee"],
  phone: ["phone", "phone number", "mobile", "msisdn", "telephone", "contact", "gsm", "contact number"],
  tin: ["tin", "tax id", "taxpayer id", "tax identification number", "firs tin", "vat number"],
  address: ["address", "street", "location", "vendor address", "office address"],
  vendorCode: ["vendor code", "supplier code", "vendor id", "supplier no", "account code", "sap code"],
  category: ["category", "vendor category", "class", "spend category", "type"],
  bankName: ["bank", "bank name", "bank/branch"],
  bankLast4: ["account", "account number", "acct no", "bank account", "account no"],
  annualSpend: [
    "annual spend",
    "spend",
    "total spend",
    "ytd spend",
    "annual value",
    "contract value",
    "purchase value",
  ],
};

function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

export type Mapping = Partial<Record<ColumnKey, number>>;

export function autoDetectColumns(headers: string[]): Mapping {
  const normalised = headers.map(normaliseHeader);
  const mapping: Mapping = {};
  const taken = new Set<number>();

  for (const key of [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as ColumnKey[]) {
    const candidates = SYNONYMS[key];
    // Exact match wins over a substring match, so "bank name" does not claim
    // the column that "account number" should have.
    let index = normalised.findIndex((h, i) => !taken.has(i) && candidates.includes(h));
    if (index === -1) {
      index = normalised.findIndex(
        (h, i) => !taken.has(i) && candidates.some((c) => h.includes(c)),
      );
    }
    if (index !== -1) {
      mapping[key] = index;
      taken.add(index);
    }
  }
  return mapping;
}

export type ParsedVendor = {
  rowNumber: number;
  businessName: string;
  phone: string;
  tin: string | null;
  tinRecovered: boolean;
  address: string;
  vendorCode: string | null;
  category: string | null;
  bankName: string | null;
  bankLast4: string | null;
  /** Integer kobo, or null when the export did not carry a spend column. */
  annualSpendKobo: number | null;
};

export type RowProblem = { rowNumber: number; problem: string };

export type IngestResult = {
  vendors: ParsedVendor[];
  problems: RowProblem[];
  tinsRecovered: number;
  missingTins: number;
  headers: string[];
  mapping: Mapping;
  /** True when spend came from their file rather than from our assumption. */
  hasSpendData: boolean;
};

/** Only the last four digits are kept. Full account numbers were cut in review. */
function lastFour(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

export function ingestVendorMaster(csv: string, override?: Mapping): IngestResult {
  const rows = parseCsv(csv);
  if (!rows.length) {
    return {
      vendors: [],
      problems: [{ rowNumber: 0, problem: "the file is empty" }],
      tinsRecovered: 0,
      missingTins: 0,
      headers: [],
      mapping: {},
      hasSpendData: false,
    };
  }

  const [headers, ...body] = rows;
  const mapping = { ...autoDetectColumns(headers), ...override };

  const vendors: ParsedVendor[] = [];
  const problems: RowProblem[] = [];
  let tinsRecovered = 0;
  let missingTins = 0;

  const at = (row: string[], key: ColumnKey): string => {
    const index = mapping[key];
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  body.forEach((row, offset) => {
    const rowNumber = offset + 2; // Header is row 1, as the buyer sees it.
    const businessName = at(row, "businessName");
    const rawPhone = at(row, "phone");

    if (!businessName) {
      problems.push({ rowNumber, problem: "no vendor name" });
      return;
    }
    const phone = parsePhone(rawPhone);
    if (!phone.ok) {
      problems.push({
        rowNumber,
        problem: rawPhone ? `"${rawPhone}" is not a Nigerian mobile number` : "no phone number",
      });
      return;
    }

    const rawTin = at(row, "tin");
    const tin = rawTin ? parseTin(rawTin) : null;
    if (!tin?.ok) missingTins += 1;
    else if (tin.recovered) tinsRecovered += 1;

    vendors.push({
      rowNumber,
      businessName,
      phone: phone.value,
      tin: tin?.ok ? tin.value : null,
      tinRecovered: Boolean(tin?.ok && tin.recovered),
      address: at(row, "address"),
      vendorCode: at(row, "vendorCode") || null,
      category: at(row, "category") || null,
      bankName: at(row, "bankName") || null,
      bankLast4: lastFour(at(row, "bankLast4")),
      annualSpendKobo: (() => {
        const raw = at(row, "annualSpend");
        if (!raw) return null;
        const parsed = parseAmountToKobo(raw);
        return parsed.ok ? parsed.value : null;
      })(),
    });
  });

  return {
    vendors,
    problems,
    tinsRecovered,
    missingTins,
    headers,
    mapping,
    hasSpendData: vendors.some((vendor) => vendor.annualSpendKobo !== null),
  };
}

export const SAMPLE_CSV = `Vendor Name,Phone Number,TIN,Address,Vendor Code,Category,Bank,Account Number,Annual Spend
Emeka Aluminium Works Ltd,08030000001,20481166-0001,"14 Ladipo Street, Oshodi, Lagos",V-1001,Fabrication,Zenith Bank,1234564471,42000000
Ify Packaging Enterprises,08030000002,20481167-0001,"9 Trade Fair Road, Ojo, Lagos",V-1002,Packaging,GTBank,0987651122,18500000
Sunrise Logistics Nigeria,08030000003,,"3 Apapa Wharf Road, Lagos",V-1003,Logistics,Access Bank,5566778899,7250000
`;
