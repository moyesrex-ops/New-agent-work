import { describe, expect, it } from "vitest";
import { NRS_EINVOICE_HOST, nrsPortalUrl, nrsQrPayload } from "@/lib/nrs";

describe("NRS portal URLs", () => {
  it("points at the live e-invoicing host, not a guessed verify path", () => {
    expect(NRS_EINVOICE_HOST).toBe("einvoice.nrs.gov.ng");
    expect(nrsPortalUrl()).toBe("https://einvoice.nrs.gov.ng/");
    expect(nrsQrPayload("IRN-7K2M-88QX-2026")).toBe(
      "https://einvoice.nrs.gov.ng/#IRN-7K2M-88QX-2026",
    );
  });
});
