/**
 * UBL / BIS Billing 3.0 mapper (ticket C-04).
 *
 * The Nigerian format is a profile over BIS Billing 3.0, so writing against
 * the published schema keeps the partner-specific delta small — one of the
 * four mitigations for the integration the architecture review flagged as most
 * likely to slip.
 *
 * Amounts are serialised from integer kobo by string surgery. They are never
 * divided by 100 into a float on the way out, because that is exactly where a
 * VAT figure would acquire a rounding error.
 */
import type { Kobo } from "../money";
import type { GatewayInvoice } from "./types";

/** 185007500 kobo -> "1850075.00". No float anywhere in this conversion. */
export function koboToDecimalString(value: Kobo): string {
  const negative = value < 0;
  const digits = Math.abs(value).toString().padStart(3, "0");
  const whole = digits.slice(0, -2);
  const fraction = digits.slice(-2);
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function basisPointsToPercent(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = (basisPoints % 100).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function party(role: "AccountingSupplierParty" | "AccountingCustomerParty", p: GatewayInvoice["supplier"]): string {
  return `  <cac:${role}>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXml(p.legalName)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(p.address)}</cbc:StreetName>
        <cac:Country><cbc:IdentificationCode>NG</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escapeXml(p.tin)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:${role}>`;
}

export function toUblXml(invoice: GatewayInvoice): string {
  const lines = invoice.lines
    .map((line, index) => {
      const lineTotal = koboToDecimalString(line.lineSubtotalKobo);
      return `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="NGN">${lineTotal}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${escapeXml(line.description)}</cbc:Description>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${line.vatBasisPoints > 0 ? "S" : "E"}</cbc:ID>
        <cbc:Percent>${basisPointsToPercent(line.vatBasisPoints)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="NGN">${koboToDecimalString(line.unitPriceKobo)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:firs.gov.ng:einvoicing:1.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${isoDate(invoice.issuedAt)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
${party("AccountingSupplierParty", invoice.supplier)}
${party("AccountingCustomerParty", invoice.buyer)}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="NGN">${koboToDecimalString(invoice.vatKobo)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="NGN">${koboToDecimalString(invoice.subtotalKobo)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="NGN">${koboToDecimalString(invoice.subtotalKobo)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="NGN">${koboToDecimalString(invoice.totalKobo)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="NGN">${koboToDecimalString(invoice.totalKobo)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
}
