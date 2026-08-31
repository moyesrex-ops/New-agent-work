import { describe, expect, it } from "vitest";
import { assertNoBankWrite, authorise, can, NotAuthorised, type Principal } from "@/lib/auth/policy";
import { amountBucket, assertNoPii } from "@/lib/analytics";

const supplier: Principal = { role: "supplier_owner", supplierId: "sup_1" };
const otherSupplier: Principal = { role: "supplier_owner", supplierId: "sup_2" };
const admin: Principal = { role: "buyer_admin", userId: "usr_1", organisationId: "org_1" };
const member: Principal = { role: "buyer_member", userId: "usr_2", organisationId: "org_1" };
const operator: Principal = { role: "operator", operatorId: "ops_1" };
const anonymous: Principal = { role: "anonymous" };

describe("policy", () => {
  it("lets a supplier act on their own records only", () => {
    expect(can(supplier, "invoice.create", { kind: "invoice", supplierId: "sup_1", organisationId: "org_1" })).toBe(true);
    expect(can(otherSupplier, "invoice.create", { kind: "invoice", supplierId: "sup_1", organisationId: "org_1" })).toBe(false);
    expect(can(supplier, "supplier.write", { kind: "supplier", supplierId: "sup_2" })).toBe(false);
  });

  it("keeps a buyer inside their own organisation", () => {
    expect(can(admin, "vendor_master.upload", { kind: "organisation", organisationId: "org_1" })).toBe(true);
    expect(can(admin, "vendor_master.upload", { kind: "organisation", organisationId: "org_2" })).toBe(false);
  });

  it("makes a buyer member read-only apart from sending invitations", () => {
    expect(can(member, "supplier_link.invite", { kind: "organisation", organisationId: "org_1" })).toBe(true);
    expect(can(member, "organisation.write", { kind: "organisation", organisationId: "org_1" })).toBe(false);
    expect(can(member, "vendor_master.upload", { kind: "organisation", organisationId: "org_1" })).toBe(false);
  });

  it("gives an operator read everywhere and exactly four writes", () => {
    expect(can(operator, "operator.read_any", { kind: "platform" })).toBe(true);
    expect(can(operator, "operator.correct_tin", { kind: "platform" })).toBe(true);
    // Not on the corrective list: an operator cannot invoice on a supplier's behalf.
    expect(can(operator, "invoice.create", { kind: "invoice", supplierId: "sup_1", organisationId: "org_1" })).toBe(false);
  });

  it("gives an anonymous visitor nothing", () => {
    expect(can(anonymous, "invoice.read", { kind: "invoice", supplierId: "sup_1", organisationId: "org_1" })).toBe(false);
    expect(can(anonymous, "operator.read_any", { kind: "platform" })).toBe(false);
  });

  it("throws rather than returning false where a caller might ignore it", () => {
    expect(() => authorise(anonymous, "invoice.create", { kind: "invoice", supplierId: "s", organisationId: "o" })).toThrow(NotAuthorised);
  });
});

describe("bank fields", () => {
  it("blocks a bank write from any path, which is the payment-diversion fence", () => {
    expect(() => assertNoBankWrite({ bankName: "Zenith Bank" })).toThrow(/not writable/);
    expect(() => assertNoBankWrite({ bank_last4: "4471" })).toThrow(/not writable/);
    expect(() => assertNoBankWrite({ businessName: "Emeka Aluminium Works Ltd" })).not.toThrow();
  });
});

describe("analytics PII guard", () => {
  it("refuses a property that names or looks like PII", () => {
    expect(() => assertNoPii({ phone: "x" })).toThrow();
    expect(() => assertNoPii({ supplier_tin: "x" })).toThrow();
    expect(() => assertNoPii({ description: "railings" })).toThrow();
    expect(() => assertNoPii({ note: "call 08030000000" })).toThrow();
    expect(() => assertNoPii({ note: "tin 20481166-0001" })).toThrow();
  });

  it("allows the shape of the business", () => {
    expect(() => assertNoPii({ bucket: "1m_5m", attempt: 2, fault: "buyer" })).not.toThrow();
  });

  it("buckets amounts instead of recording them", () => {
    expect(amountBucket(10_000_00)).toBe("under_50k");
    expect(amountBucket(185_007_500)).toBe("1m_5m");
    expect(amountBucket(900_000_000)).toBe("over_5m");
  });
});
