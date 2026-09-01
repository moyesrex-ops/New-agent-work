import { describe, expect, it } from "vitest";
import {
  addKobo,
  applyBasisPoints,
  formatKobo,
  formatNaira,
  kobo,
  koboToWords,
  multiplyKobo,
  parseAmountToKobo,
} from "@/lib/money";

describe("kobo", () => {
  it("refuses a non-integer, because a fraction of a kobo is a rejected invoice", () => {
    expect(() => kobo(12.5)).toThrow(TypeError);
    expect(() => kobo(Number.NaN)).toThrow(TypeError);
  });
});

describe("parseAmountToKobo", () => {
  it.each([
    ["1850075.00", 185_007_500],
    ["1,850,075.00", 185_007_500],
    ["₦1,850,075", 185_007_500],
    ["NGN 1 850 075.5", 185_007_550],
    ["0.01", 1],
    ["0.1", 10],
    [".5", 50],
    ["34420", 3_442_000],
  ])("parses %s", (input, expected) => {
    const result = parseAmountToKobo(input);
    expect(result.ok && result.value).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["abc", "not_a_number"],
    ["12.345", "too_many_decimals"],
    ["1.005", "too_many_decimals"],
    ["-5", "negative"],
    ["9999999999999", "too_large"],
  ])("rejects %s", (input, error) => {
    const result = parseAmountToKobo(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe(error);
  });

  it("never loses a kobo through a float round trip", () => {
    // 0.29 and 0.57 are the classic IEEE-754 casualties.
    for (const value of ["0.29", "0.57", "1.01", "1234567.89"]) {
      const parsed = parseAmountToKobo(value);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(formatKobo(parsed.value).replace(/,/g, "")).toBe(Number(value).toFixed(2));
      }
    }
  });
});

describe("formatting", () => {
  it("groups thousands and always shows two decimals", () => {
    expect(formatKobo(kobo(185_007_500))).toBe("1,850,075.00");
    expect(formatKobo(kobo(5))).toBe("0.05");
    expect(formatKobo(kobo(0))).toBe("0.00");
    expect(formatNaira(kobo(185_007_500))).toBe("NGN 1,850,075.00");
  });
});

describe("arithmetic", () => {
  it("multiplies by a whole quantity exactly", () => {
    expect(multiplyKobo(kobo(3_442_000), 50)).toBe(172_100_000);
  });

  it("rejects a fractional quantity rather than silently truncating", () => {
    expect(() => multiplyKobo(kobo(100), 1.5)).toThrow(TypeError);
    expect(() => multiplyKobo(kobo(100), -1)).toThrow(TypeError);
  });

  it("rounds basis points half away from zero, matching the buyer's ERP", () => {
    // 7.5% of 1,721,000.00 = 129,075.00 exactly.
    expect(applyBasisPoints(kobo(172_100_000), 750)).toBe(12_907_500);
    // 7.5% of 1.00 = 0.075 -> 0.08, not 0.07.
    expect(applyBasisPoints(kobo(100), 750)).toBe(8);
    // Exactly half rounds up: 7.5% of 0.20 = 0.015 -> 0.02.
    expect(applyBasisPoints(kobo(20), 750)).toBe(2);
    expect(applyBasisPoints(kobo(0), 750)).toBe(0);
  });

  it("sums without drift over many additions", () => {
    const parts = Array.from({ length: 1000 }, () => kobo(1));
    expect(addKobo(...parts)).toBe(1000);
  });
});

describe("koboToWords", () => {
  it("announces the amount the way a person would say it", () => {
    expect(koboToWords(kobo(185_007_500))).toBe(
      "one million eight hundred and fifty thousand and seventy-five naira",
    );
    expect(koboToWords(kobo(105))).toBe("one naira and five kobo");
    expect(koboToWords(kobo(0))).toBe("zero naira");
  });
});
