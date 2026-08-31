import { describe, expect, it } from "vitest";
import {
  autoDetectColumns,
  ingestVendorMaster,
  parseCsv,
  SAMPLE_CSV,
} from "@/lib/services/vendor-master";

describe("CSV parsing", () => {
  it("handles quoted commas, escaped quotes and CRLF", () => {
    const rows = parseCsv('a,b\r\n"1,2","he said ""hi"""\r\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["1,2", 'he said "hi"'],
    ]);
  });

  it("drops blank lines instead of reporting them as bad rows", () => {
    expect(parseCsv("a,b\n\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("column auto-detection", () => {
  it("recognises the header names real ERP exports use", () => {
    const mapping = autoDetectColumns([
      "Supplier Code",
      "Vendor Name",
      "GSM",
      "Tax ID",
      "Office Address",
    ]);
    expect(mapping.vendorCode).toBe(0);
    expect(mapping.businessName).toBe(1);
    expect(mapping.phone).toBe(2);
    expect(mapping.tin).toBe(3);
    expect(mapping.address).toBe(4);
  });

  it("does not let one column be claimed twice", () => {
    // "Bank" and "Bank Account" both contain "bank"; they must not collide.
    const mapping = autoDetectColumns(["Vendor Name", "Phone", "Bank", "Bank Account"]);
    expect(mapping.bankName).toBe(2);
    expect(mapping.bankLast4).toBe(3);
  });

  it("reports a required column it cannot find, rather than guessing", () => {
    const mapping = autoDetectColumns(["Column A", "Column B"]);
    expect(mapping.businessName).toBeUndefined();
    expect(mapping.phone).toBeUndefined();
  });
});

describe("vendor master ingest", () => {
  it("reads the sample file the console offers for download", () => {
    const result = ingestVendorMaster(SAMPLE_CSV);
    expect(result.vendors).toHaveLength(3);
    expect(result.problems).toHaveLength(0);
    expect(result.vendors[0].businessName).toBe("Emeka Aluminium Works Ltd");
    expect(result.vendors[0].phone).toBe("+2348030000001");
    expect(result.vendors[0].tin).toBe("20481166-0001");
    expect(result.hasSpendData).toBe(true);
  });

  it("keeps only the last four digits of an account number", () => {
    const result = ingestVendorMaster(SAMPLE_CSV);
    expect(result.vendors[0].bankLast4).toBe("4471");
    // The full number appeared in the file and must not survive ingest.
    expect(JSON.stringify(result.vendors)).not.toContain("1234564471");
  });

  it("counts a missing TIN as uncheckable rather than dropping the row", () => {
    const result = ingestVendorMaster(SAMPLE_CSV);
    expect(result.missingTins).toBe(1);
    expect(result.vendors).toHaveLength(3);
  });

  it("recovers a spreadsheet-mangled TIN and reports the count", () => {
    const csv = "Vendor Name,Phone,TIN\nAcme Ltd,08030000009,12345670001\n";
    const result = ingestVendorMaster(csv);
    expect(result.vendors[0].tin).toBe("01234567-0001");
    expect(result.tinsRecovered).toBe(1);
  });

  it("names the row and the problem instead of failing the whole file", () => {
    const csv = [
      "Vendor Name,Phone",
      "Good Ltd,08030000001",
      ",08030000002",
      "No Phone Ltd,",
      "Bad Phone Ltd,+15551234567",
    ].join("\n");
    const result = ingestVendorMaster(csv);

    expect(result.vendors).toHaveLength(1);
    expect(result.problems).toEqual([
      { rowNumber: 3, problem: "no vendor name" },
      { rowNumber: 4, problem: "no phone number" },
      { rowNumber: 5, problem: '"+15551234567" is not a Nigerian mobile number' },
    ]);
  });

  it("numbers rows the way the buyer sees them in their spreadsheet", () => {
    const result = ingestVendorMaster("Vendor Name,Phone\n,08030000001\n");
    expect(result.problems[0].rowNumber).toBe(2);
  });

  it("says the file is empty rather than throwing", () => {
    expect(ingestVendorMaster("").problems[0].problem).toBe("the file is empty");
  });

  it("respects a manual mapping override from the mapping screen", () => {
    const csv = "Column A,Column B\nAcme Ltd,08030000001\n";
    const result = ingestVendorMaster(csv, { businessName: 0, phone: 1 });
    expect(result.vendors).toHaveLength(1);
    expect(result.vendors[0].businessName).toBe("Acme Ltd");
  });
});
