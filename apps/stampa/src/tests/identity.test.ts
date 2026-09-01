import { describe, expect, it } from "vitest";
import { formatPhone, isSamePhone, maskPhone, parsePhone, toMsisdn } from "@/lib/phone";
import { maskTin, parseTin } from "@/lib/tin";

describe("phone", () => {
  it.each([
    "08030000000",
    "0803 000 0000",
    "0803-000-0000",
    "+2348030000000",
    "2348030000000",
    "+234 803 000 0000",
    // Excel ate the leading zero. Same person.
    "8030000000",
  ])("normalises %s to E.164", (input) => {
    const result = parsePhone(input);
    expect(result.ok && result.value).toBe("+2348030000000");
  });

  it("accepts every Nigerian mobile range in use", () => {
    for (const prefix of ["070", "080", "081", "090", "091"]) {
      const result = parsePhone(`${prefix}30000000`);
      expect(result.ok, prefix).toBe(true);
    }
  });

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["+15551234567", "not_nigerian"],
    ["0803000", "wrong_length"],
    ["080300000000", "wrong_length"],
    // Right length, wrong range: 06 and 01 are not mobile.
    ["06030000000", "not_a_mobile"],
    ["01234567890", "not_a_mobile"],
  ])("rejects %s", (input, error) => {
    const result = parsePhone(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe(error);
  });

  it("recognises the same number written two ways", () => {
    expect(isSamePhone("08030000000", "+234 803 000 0000")).toBe(true);
    expect(isSamePhone("08030000000", "08030000001")).toBe(false);
  });

  it("displays as Nigerians read their own number, and masks for support", () => {
    expect(formatPhone("+2348030000000")).toBe("0803 000 0000");
    expect(maskPhone("+2348030000000")).toBe("0803 ••• 0000");
  });

  it("returns the input unchanged rather than crashing on junk", () => {
    expect(formatPhone("not a phone")).toBe("not a phone");
  });

  it("strips the plus for Termii and Meta", () => {
    expect(toMsisdn("+2348030000000")).toBe("2348030000000");
    expect(toMsisdn("08030000000")).toBe("2348030000000");
  });
});

describe("TIN", () => {
  it("accepts the canonical form without claiming a recovery", () => {
    const result = parseTin("20481166-0001");
    expect(result.ok && result.value).toBe("20481166-0001");
    expect(result.ok && result.recovered).toBe(false);
  });

  it("restores a leading zero eaten by a spreadsheet, and says that it did", () => {
    // "01234567-0001" stored by Excel as the number 12345670001.
    const result = parseTin("12345670001");
    expect(result.ok && result.value).toBe("01234567-0001");
    expect(result.ok && result.recovered).toBe(true);
  });

  it("reshapes a bare 12-digit run", () => {
    const result = parseTin("204811660001");
    expect(result.ok && result.value).toBe("20481166-0001");
    expect(result.ok && result.recovered).toBe(true);
  });

  it("assumes the head-office branch when only eight digits are given", () => {
    const result = parseTin("20481166");
    expect(result.ok && result.value).toBe("20481166-0001");
    expect(result.ok && result.recovered).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["not-a-tin", "not_numeric"],
    ["1234567", "wrong_length"],
    ["1234567890123", "wrong_length"],
  ])("rejects %s", (input, error) => {
    const result = parseTin(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe(error);
  });

  it("masks the body but keeps the branch, so support can confirm without reading it out", () => {
    expect(maskTin("20481166-0001")).toBe("••••1166-0001");
  });
});
