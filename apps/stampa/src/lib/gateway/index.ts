/**
 * Gateway selection. Exactly one place decides which implementation is live,
 * and it says so out loud on every surface that shows a stamp.
 */
import { env } from "../env";
import { FakeGateway } from "./fake";
import type { EInvoiceGateway } from "./types";

export * from "./types";
export {
  toGatewayError,
  caseNumber,
  describeCode,
  formatOffendingValue,
  ERROR_MAP,
} from "./errors";
export { toUblXml } from "./ubl";
export { FakeGateway, FAKE_TRIGGERS, deterministicIrn } from "./fake";

export type GatewayMode = "fake" | "sandbox" | "partner";

export function gatewayMode(): GatewayMode {
  return env().STAMPA_GATEWAY;
}

/**
 * The contingency in Architecture §16.7 requires that a demo running on the
 * fake gateway is labelled honestly rather than quietly. This is the flag the
 * UI reads to do that, and it is the reason the label cannot be forgotten.
 */
export function isSimulatedGateway(): boolean {
  return gatewayMode() === "fake";
}

let cached: EInvoiceGateway | null = null;

export function getGateway(): EInvoiceGateway {
  if (cached) return cached;

  switch (gatewayMode()) {
    case "sandbox":
    case "partner":
      // PartnerGateway is ticket C-08 and lands in week 4, gated on sandbox
      // credentials. Failing loudly here is deliberate: silently falling back
      // to the fake gateway in production would mean issuing invented tax
      // references to real suppliers.
      throw new Error(
        "PartnerGateway is not implemented. Set STAMPA_GATEWAY=fake for local development.",
      );
    default:
      cached = new FakeGateway({ latencyMs: env().STAMPA_FAKE_LATENCY_MS });
      return cached;
  }
}
