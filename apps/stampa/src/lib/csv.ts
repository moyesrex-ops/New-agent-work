/**
 * CSV writing. Reading lives in services/vendor-master.ts, because that one
 * has to survive real ERP exports and this one only has to be correct.
 *
 * Excel is the destination for both exports in v1 — a supplier's records and a
 * buyer's VAT return workings — so quoting is unconditional and line endings
 * are CRLF.
 */
export function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function toCsv(header: readonly string[], rows: readonly unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
