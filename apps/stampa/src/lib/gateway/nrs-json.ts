/**
 * NRS APP JSON mapper (Interswitch SwitchTax / equivalent accredited APP).
 *
 * Amounts leave as decimal strings produced from integer kobo, then parsed
 * at the wire. The float exists only in the JSON the partner specified —
 * never in storage, never in VAT arithmetic.
 *
 * Documented from Interswitch NRS E-Invoicing (postInvoice schema) and the
 * public DigiTax / Doftwerks APP client contracts on GitHub.
 */
import { koboToDecimalString, basisPointsToPercent } from "./ubl";
import type { GatewayInvoice } from "./types";

export type NrsParty = {
  party_name: string;
  tin: string;
  email: string;
  telephone: string;
  business_description: string;
  postal_address: {
    street_name: string;
    city_name: string;
    postal_zone: string;
    country: "NG";
  };
};

export type NrsInvoicePayload = {
  business_id: string;
  irn: string;
  invoice_kind: "B2B";
  issue_date: string;
  due_date: string;
  issue_time: string;
  invoice_type_code: "380";
  payment_status: "PENDING";
  tax_point_date: string;
  document_currency_code: "NGN";
  tax_currency_code: "NGN";
  accounting_supplier_party: NrsParty;
  accounting_customer_party: NrsParty;
  invoice_line: Array<{
    hsn_code: string;
    product_category: string;
    discount_rate: number;
    discount_amount: number;
    fee_rate: number;
    fee_amount: number;
    invoiced_quantity: number;
    line_extension_amount: number;
    item: {
      name: string;
      description: string;
      sellers_item_identification: string;
    };
    price: {
      price_amount: number;
      base_quantity: number;
      price_unit: "EA";
    };
  }>;
  tax_total: Array<{
    tax_amount: number;
    tax_subtotal: Array<{
      taxable_amount: number;
      tax_amount: number;
      tax_category: { id: "STANDARD_VAT" | "ZERO_VAT"; percent: number };
    }>;
  }>;
  legal_monetary_total: {
    line_extension_amount: number;
    tax_exclusive_amount: number;
    tax_inclusive_amount: number;
    payable_amount: number;
  };
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isoTime(date: Date): string {
  return date.toISOString().slice(11, 19);
}

function naira(kobo: number): number {
  return Number(koboToDecimalString(kobo as never));
}

function splitAddress(address: string): { street: string; city: string } {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return { street: address || "Nigeria", city: "Lagos" };
  if (parts.length === 1) return { street: parts[0], city: "Lagos" };
  return { street: parts.slice(0, -1).join(", "), city: parts[parts.length - 1] };
}

function party(name: string, tin: string, address: string, phone: string, email: string): NrsParty {
  const { street, city } = splitAddress(address);
  return {
    party_name: name,
    tin,
    email,
    telephone: phone,
    business_description: "Trade",
    postal_address: {
      street_name: street,
      city_name: city,
      postal_zone: "",
      country: "NG",
    },
  };
}

/**
 * IRN candidate in the APP SI format: InvoiceNo-ServiceId-YYYYMMDD.
 * The partner may return a different IRN; we store whatever they stamp.
 */
export function candidateIrn(invoiceNumber: string, serviceId: string, issuedAt: Date): string {
  const safeNumber = invoiceNumber.replace(/[^A-Za-z0-9]/g, "").slice(0, 20) || "INV";
  const safeService = serviceId.replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "STAMPA";
  const ymd = isoDate(issuedAt).replaceAll("-", "");
  return `${safeNumber}-${safeService}-${ymd}`.slice(0, 50);
}

export function toNrsJson(
  invoice: GatewayInvoice,
  options: {
    businessId: string;
    serviceId: string;
    supplierPhone?: string;
    supplierEmail?: string;
    buyerPhone?: string;
    buyerEmail?: string;
  },
): NrsInvoicePayload {
  const issue = isoDate(invoice.issuedAt);
  const lines = invoice.lines.map((line) => {
    const percent = Number(basisPointsToPercent(line.vatBasisPoints));
    return {
      hsn_code: "",
      product_category: line.description.slice(0, 100),
      discount_rate: 0,
      discount_amount: 0,
      fee_rate: 0,
      fee_amount: 0,
      invoiced_quantity: line.quantity,
      line_extension_amount: naira(line.lineSubtotalKobo),
      item: {
        name: line.description.slice(0, 100),
        description: line.description,
        sellers_item_identification: line.description.slice(0, 50),
      },
      price: {
        price_amount: naira(line.unitPriceKobo),
        base_quantity: 1,
        price_unit: "EA" as const,
      },
      vatPercent: percent,
      vatNaira: naira(line.lineVatKobo),
    };
  });

  const subtotals = new Map<string, { taxable: number; vat: number; percent: number }>();
  for (const line of lines) {
    const key = line.vatPercent === 0 ? "ZERO_VAT" : "STANDARD_VAT";
    const current = subtotals.get(key) ?? { taxable: 0, vat: 0, percent: line.vatPercent };
    current.taxable += line.line_extension_amount;
    current.vat += line.vatNaira;
    subtotals.set(key, current);
  }

  return {
    business_id: options.businessId,
    irn: candidateIrn(invoice.invoiceNumber, options.serviceId, invoice.issuedAt),
    invoice_kind: "B2B",
    issue_date: issue,
    due_date: issue,
    issue_time: isoTime(invoice.issuedAt),
    invoice_type_code: "380",
    payment_status: "PENDING",
    tax_point_date: issue,
    document_currency_code: "NGN",
    tax_currency_code: "NGN",
    accounting_supplier_party: party(
      invoice.supplier.legalName,
      invoice.supplier.tin,
      invoice.supplier.address,
      options.supplierPhone ?? "",
      options.supplierEmail ?? "noreply@stampa.ng",
    ),
    accounting_customer_party: party(
      invoice.buyer.legalName,
      invoice.buyer.tin,
      invoice.buyer.address,
      options.buyerPhone ?? "",
      options.buyerEmail ?? "finance@buyer.invalid",
    ),
    invoice_line: lines.map(({ vatPercent, vatNaira, ...line }) => {
      void vatPercent;
      void vatNaira;
      return line;
    }),
    tax_total: [
      {
        tax_amount: naira(invoice.vatKobo),
        tax_subtotal: [...subtotals.entries()].map(([id, row]) => ({
          taxable_amount: row.taxable,
          tax_amount: row.vat,
          tax_category: {
            id: id as "STANDARD_VAT" | "ZERO_VAT",
            percent: row.percent,
          },
        })),
      },
    ],
    legal_monetary_total: {
      line_extension_amount: naira(invoice.subtotalKobo),
      tax_exclusive_amount: naira(invoice.subtotalKobo),
      tax_inclusive_amount: naira(invoice.totalKobo),
      payable_amount: naira(invoice.totalKobo),
    },
  };
}
